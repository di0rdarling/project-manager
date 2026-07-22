import { ObjectId, type Db } from "mongodb";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import { stripRichText } from "@/lib/rich-text";
import type { StoredChat } from "@/lib/serialize/serialize-chat";
import type { StoredProject } from "@/lib/serialize/serialize-project";

export type TeammateChatSummary = {
  chatId: string;
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

  const projects =
    projectIds.length > 0
      ? await db
          .collection<StoredProject>("projects")
          .find({ _id: { $in: projectIds }, userId })
          .toArray()
      : [];

  const projectById = new Map(
    projects.map((project) => [project._id.toString(), project]),
  );

  return chatsWithSummaries.map((chat) => {
    const project = chat.projectId
      ? projectById.get(chat.projectId.toString())
      : undefined;

    return {
      chatId: chat._id.toString(),
      teammateId: isChatTeammateId(chat.teammateId)
        ? chat.teammateId
        : DEFAULT_CHAT_TEAMMATE_ID,
      title: chat.title,
      createdAt: toIsoString(chat.createdAt),
      updatedAt: toIsoString(chat.updatedAt),
      summary: chat.conversationSummary!.trim(),
      project: project
        ? {
            name: project.name,
            description: stripRichText(project.description),
            aiSummary:
              typeof project.aiSummary === "string" &&
              project.aiSummary.trim().length > 0
                ? project.aiSummary.trim()
                : null,
          }
        : null,
    };
  });
}

type GetTeammateChatSummariesOptions = {
  excludeChatId?: ObjectId;
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

  const chats = await cursor.toArray();
  const summaries = await summarizeChats(db, userId, chats);

  if (options?.limit) {
    return summaries.slice(0, options.limit);
  }

  return summaries;
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
  const chats = await db
    .collection<StoredChat>("chats")
    .find({
      userId,
      teammateId: { $ne: currentTeammateId },
      archivedAt: null,
    })
    .sort({ updatedAt: -1 })
    .limit(Math.max(limit * 3, limit))
    .toArray();

  const summaries = await summarizeChats(db, userId, chats);
  return summaries.slice(0, limit);
}
