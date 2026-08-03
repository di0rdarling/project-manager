import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import type { ChatMessageRole } from "@/lib/types";
import type { AgentTaskOverviewMessageResponse } from "@/lib/types";

export const AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION =
  "agent_task_overview_messages";

type StoredTaskOverviewMessage = {
  _id: ObjectId;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string | Date;
};

function serializeTaskOverviewMessage(
  message: StoredTaskOverviewMessage,
): AgentTaskOverviewMessageResponse {
  return {
    _id: message._id.toString(),
    role: message.role,
    content: message.content,
    createdAt: toIsoString(message.createdAt),
  };
}

export async function getTaskOverviewMessages(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
): Promise<AgentTaskOverviewMessageResponse[]> {
  const messages = await db
    .collection<StoredTaskOverviewMessage>(
      AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION,
    )
    .find({ userId, teammateId, projectId, taskTitle })
    .sort({ createdAt: 1 })
    .toArray();

  return messages.map(serializeTaskOverviewMessage);
}

type InsertTaskOverviewMessagesInput = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
  userContent: string;
  assistantContent: string;
  createdAt: string;
};

export async function insertTaskOverviewMessages(
  db: Db,
  input: InsertTaskOverviewMessagesInput,
): Promise<{
  userMessage: AgentTaskOverviewMessageResponse;
  assistantMessage: AgentTaskOverviewMessageResponse;
}> {
  const base = {
    userId: input.userId,
    teammateId: input.teammateId,
    projectId: input.projectId,
    taskTitle: input.taskTitle,
    createdAt: input.createdAt,
  };

  const userInsert = await db
    .collection<Omit<StoredTaskOverviewMessage, "_id">>(
      AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION,
    )
    .insertOne({
      ...base,
      role: "user",
      content: input.userContent,
    });

  const assistantInsert = await db
    .collection<Omit<StoredTaskOverviewMessage, "_id">>(
      AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION,
    )
    .insertOne({
      ...base,
      role: "model",
      content: input.assistantContent,
    });

  return {
    userMessage: serializeTaskOverviewMessage({
      _id: userInsert.insertedId,
      ...base,
      role: "user",
      content: input.userContent,
    }),
    assistantMessage: serializeTaskOverviewMessage({
      _id: assistantInsert.insertedId,
      ...base,
      role: "model",
      content: input.assistantContent,
    }),
  };
}
