import { ObjectId, type Db } from "mongodb";
import { AGENT_DOCUMENTS_COLLECTION } from "@/lib/agents/agent-documents-store";
import { AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION } from "@/lib/agents/agent-document-review-session-store";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import { stripRichText } from "@/lib/rich-text";
import type { StoredChat } from "@/lib/serialize/serialize-chat";
import type { StoredProject } from "@/lib/serialize/serialize-project";
import type { AgentDocument } from "@/lib/types";

export type TeammateChatSummaryKind = "chat" | "document_review";

export type TeammateChatSummary = {
  chatId: string;
  kind: TeammateChatSummaryKind;
  teammateId: ChatTeammateId;
  title: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  project: {
    name: string;
    description: string;
    aiSummary: string | null;
  } | null;
};

/**
 * Max conversation summaries included when building context from chat
 * history — cross-agent live chat, manual Overview rebuild, etc. Sorted by
 * `updatedAt` (most recent first).
 */
export const RECENT_CHAT_SUMMARY_LIMIT = 5;

export const DOCUMENT_REVIEW_CHAT_ID_PREFIX = "document-review:";

type StoredDocumentReviewSession = {
  _id: ObjectId;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  documentId: ObjectId;
  conversationSummary: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StoredAgentDocumentForSummary = Pick<
  AgentDocument,
  "_id" | "projectId" | "title" | "projectName"
>;

function mergeSummariesByRecency(
  ...lists: TeammateChatSummary[][]
): TeammateChatSummary[] {
  const byId = new Map<string, TeammateChatSummary>();

  for (const list of lists) {
    for (const summary of list) {
      byId.set(summary.chatId, summary);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function applySummaryLimit(
  summaries: TeammateChatSummary[],
  limit?: number,
): TeammateChatSummary[] {
  if (!limit) {
    return summaries;
  }

  return summaries.slice(0, limit);
}

async function loadProjectContextById(
  db: Db,
  userId: ObjectId,
  projectIds: ObjectId[],
): Promise<Map<string, StoredProject>> {
  if (projectIds.length === 0) {
    return new Map();
  }

  const projects = await db
    .collection<StoredProject>("projects")
    .find({ _id: { $in: projectIds }, userId })
    .toArray();

  return new Map(projects.map((project) => [project._id.toString(), project]));
}

function serializeProjectContext(
  project: StoredProject | undefined,
  fallbackName?: string | null,
): TeammateChatSummary["project"] {
  if (project) {
    return {
      name: project.name,
      description: stripRichText(project.description),
      aiSummary:
        typeof project.aiSummary === "string" &&
        project.aiSummary.trim().length > 0
          ? project.aiSummary.trim()
          : null,
    };
  }

  if (fallbackName?.trim()) {
    return {
      name: fallbackName.trim(),
      description: "",
      aiSummary: null,
    };
  }

  return null;
}

async function summarizeChats(
  db: Db,
  userId: ObjectId,
  chats: StoredChat[],
): Promise<TeammateChatSummary[]> {
  const chatsWithSummaries = chats.filter(
    (chat) =>
      typeof chat.conversationSummary === "string" &&
      chat.conversationSummary.trim().length > 0,
  );

  const projectIds = [
    ...new Set(
      chatsWithSummaries
        .map((chat) => chat.projectId?.toString())
        .filter((projectId): projectId is string => Boolean(projectId)),
    ),
  ].map((projectId) => new ObjectId(projectId));

  const projectById = await loadProjectContextById(db, userId, projectIds);

  return chatsWithSummaries.map((chat) => {
    const project = chat.projectId
      ? projectById.get(chat.projectId.toString())
      : undefined;

    return {
      chatId: chat._id.toString(),
      kind: "chat" as const,
      teammateId: isChatTeammateId(chat.teammateId)
        ? chat.teammateId
        : DEFAULT_CHAT_TEAMMATE_ID,
      title: chat.title,
      createdAt: toIsoString(chat.createdAt),
      updatedAt: toIsoString(chat.updatedAt),
      summary: chat.conversationSummary!.trim(),
      project: serializeProjectContext(project),
    };
  });
}

async function summarizeDocumentReviewSessions(
  sessions: StoredDocumentReviewSession[],
  documentsById: Map<string, StoredAgentDocumentForSummary>,
  projectById: Map<string, StoredProject>,
): Promise<TeammateChatSummary[]> {
  const summaries: TeammateChatSummary[] = [];

  for (const session of sessions) {
    const summary = session.conversationSummary?.trim();
    if (!summary) {
      continue;
    }

    const document = documentsById.get(session.documentId.toString());
    if (!document) {
      continue;
    }

    const documentTitle = document.title?.trim() || "Untitled document";
    const project = document.projectId
      ? projectById.get(document.projectId.toString())
      : undefined;

    summaries.push({
      chatId: `${DOCUMENT_REVIEW_CHAT_ID_PREFIX}${session.documentId.toString()}`,
      kind: "document_review",
      teammateId: session.teammateId,
      title: `Review: ${documentTitle}`,
      createdAt: toIsoString(session.createdAt),
      updatedAt: toIsoString(session.updatedAt),
      summary,
      project: serializeProjectContext(project, document.projectName),
    });
  }

  return summaries;
}

async function loadDocumentReviewChatSummaries(
  db: Db,
  userId: ObjectId,
  options: {
    teammateId?: ChatTeammateId;
    excludeTeammateId?: ChatTeammateId;
    excludeDocumentReviewId?: ObjectId;
    projectId?: ObjectId;
    limit?: number;
  },
): Promise<TeammateChatSummary[]> {
  const query: Record<string, unknown> = { userId };

  if (options.teammateId) {
    query.teammateId = options.teammateId;
  }

  if (options.excludeTeammateId) {
    query.teammateId = { $ne: options.excludeTeammateId };
  }

  if (options.excludeDocumentReviewId) {
    query.documentId = { $ne: options.excludeDocumentReviewId };
  }

  let cursor = db
    .collection<StoredDocumentReviewSession>(
      AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION,
    )
    .find(query)
    .sort({ updatedAt: -1 });

  if (options.limit) {
    cursor = cursor.limit(Math.max(options.limit * 3, options.limit));
  }

  const sessions = await cursor.toArray();
  const sessionsWithSummaries = sessions.filter((session) =>
    session.conversationSummary?.trim(),
  );

  if (sessionsWithSummaries.length === 0) {
    return [];
  }

  const documentIds = [
    ...new Set(sessionsWithSummaries.map((session) => session.documentId)),
  ];

  const documents = await db
    .collection<StoredAgentDocumentForSummary>(AGENT_DOCUMENTS_COLLECTION)
    .find({ _id: { $in: documentIds }, userId })
    .toArray();

  const documentsById = new Map(
    documents.map((document) => [document._id.toString(), document]),
  );

  let filteredSessions = sessionsWithSummaries.filter((session) =>
    documentsById.has(session.documentId.toString()),
  );

  if (options.projectId) {
    filteredSessions = filteredSessions.filter((session) => {
      const document = documentsById.get(session.documentId.toString());
      return document?.projectId.equals(options.projectId!);
    });
  }

  const projectIds = [
    ...new Set(
      filteredSessions
        .map((session) => documentsById.get(session.documentId.toString())?.projectId)
        .filter((projectId): projectId is ObjectId => Boolean(projectId)),
    ),
  ];

  const projectById = await loadProjectContextById(db, userId, projectIds);

  return summarizeDocumentReviewSessions(
    filteredSessions,
    documentsById,
    projectById,
  );
}

type GetTeammateChatSummariesOptions = {
  excludeChatId?: ObjectId;
  /**
   * When set, omits the document review session for this deliverable from
   * "other conversations" context (the live transcript is used instead).
   */
  excludeDocumentReviewId?: ObjectId;
  /**
   * When true, archived chats are omitted. Use for live-chat "other
   * conversations" context so finished threads do not clutter active work.
   */
  excludeArchived?: boolean;
  /**
   * Max summaries returned, most recently updated first. Chats without a
   * stored conversation summary are skipped and do not count toward the cap.
   */
  limit?: number;
  /** When set, only chats linked to this project are included. */
  projectId?: ObjectId;
};

export async function getTeammateChatSummaries(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  options?: GetTeammateChatSummariesOptions,
): Promise<TeammateChatSummary[]> {
  const query: Record<string, unknown> = { userId, teammateId };

  if (options?.excludeChatId) {
    query._id = { $ne: options.excludeChatId };
  }

  if (options?.excludeArchived) {
    query.archivedAt = null;
  }

  if (options?.projectId) {
    query.projectId = options.projectId;
  }

  let cursor = db
    .collection<StoredChat>("chats")
    .find(query)
    .sort({ updatedAt: -1 });

  if (options?.limit) {
    cursor = cursor.limit(Math.max(options.limit * 3, options.limit));
  }

  const [chats, documentReviewSummaries] = await Promise.all([
    cursor.toArray(),
    loadDocumentReviewChatSummaries(db, userId, {
      teammateId,
      excludeDocumentReviewId: options?.excludeDocumentReviewId,
      projectId: options?.projectId,
      limit: options?.limit,
    }),
  ]);

  const chatSummaries = await summarizeChats(db, userId, chats);
  const merged = mergeSummariesByRecency(chatSummaries, documentReviewSummaries);

  return applySummaryLimit(merged, options?.limit);
}

/**
 * Recent conversation summaries from teammates other than the one in the
 * current chat. Active (non-archived) chats only, globally sorted by
 * `updatedAt` descending, capped at `limit`.
 */
export async function getOtherTeammatesRecentChatSummaries(
  db: Db,
  userId: ObjectId,
  currentTeammateId: ChatTeammateId,
  limit: number = RECENT_CHAT_SUMMARY_LIMIT,
): Promise<TeammateChatSummary[]> {
  const fetchLimit = Math.max(limit * 3, limit);

  const [chats, documentReviewSummaries] = await Promise.all([
    db
      .collection<StoredChat>("chats")
      .find({
        userId,
        teammateId: { $ne: currentTeammateId },
        archivedAt: null,
      })
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .toArray(),
    loadDocumentReviewChatSummaries(db, userId, {
      excludeTeammateId: currentTeammateId,
      limit,
    }),
  ]);

  const chatSummaries = await summarizeChats(db, userId, chats);
  const merged = mergeSummariesByRecency(chatSummaries, documentReviewSummaries);

  return applySummaryLimit(merged, limit);
}
