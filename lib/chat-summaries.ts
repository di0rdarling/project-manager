import { ObjectId, type Db } from "mongodb";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import { toIsoString } from "@/lib/dates";
import { stripRichText } from "@/lib/rich-text";
import type { StoredChat } from "@/lib/serialize-chat";
import type { StoredProject } from "@/lib/serialize-project";

export type TeammateChatSummary = {
  chatId: string;
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

  const chats = await db
    .collection<StoredChat>("chats")
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();

  return summarizeChats(db, userId, chats);
}
