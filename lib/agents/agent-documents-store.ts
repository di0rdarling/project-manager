import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import {
  AGENT_TASKS_COLLECTION,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import type {
  AgentDocument,
  AgentDocumentResponse,
  AgentDocumentStatus,
} from "@/lib/types";

export const AGENT_DOCUMENTS_COLLECTION = "agent_documents";

type StoredAgentDocument = Omit<
  AgentDocument,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: AgentDocument["_id"];
  projectId: AgentDocument["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function serializeAgentDocument(
  document: StoredAgentDocument,
): AgentDocumentResponse {
  return {
    _id: document._id.toString(),
    userId: document.userId.toString(),
    teammateId: document.teammateId,
    projectId: document.projectId.toString(),
    projectName: document.projectName,
    title: document.title,
    content: document.content,
    status: document.status,
    taskTitle: document.taskTitle,
    createdAt: toIsoString(document.createdAt),
    updatedAt: document.updatedAt
      ? toIsoString(document.updatedAt)
      : toIsoString(document.createdAt),
  };
}

export async function getAgentDocuments(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Promise<AgentDocumentResponse[]> {
  const documents = await db
    .collection<StoredAgentDocument>(AGENT_DOCUMENTS_COLLECTION)
    .find({ userId, teammateId })
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map(serializeAgentDocument);
}

/** Resolves task titles from agent_tasks records when not stored on the document. */
export async function attachTaskTitlesToDocuments(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documents: AgentDocumentResponse[],
): Promise<AgentDocumentResponse[]> {
  if (documents.length === 0) {
    return documents;
  }

  const taskRecords = await db
    .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
    .find({ userId, teammateId })
    .toArray();

  const documentIdToTaskTitle = new Map<string, string>();

  for (const record of taskRecords) {
    for (const task of record.tasks) {
      if (task.outputDocumentId) {
        documentIdToTaskTitle.set(task.outputDocumentId, task.title);
      }
    }
  }

  return documents.map((document) => ({
    ...document,
    taskTitle: document.taskTitle ?? documentIdToTaskTitle.get(document._id),
  }));
}

export async function getAgentDocumentById(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
): Promise<AgentDocumentResponse | null> {
  const document = await db
    .collection<StoredAgentDocument>(AGENT_DOCUMENTS_COLLECTION)
    .findOne({ _id: documentId, userId, teammateId });

  return document ? serializeAgentDocument(document) : null;
}

type CreateAgentDocumentInput = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  projectName?: string | null;
  title: string;
  content: string;
  taskTitle?: string;
  status?: AgentDocumentStatus;
};

export async function createAgentDocument(
  db: Db,
  input: CreateAgentDocumentInput,
): Promise<AgentDocumentResponse> {
  const now = new Date().toISOString();
  const document: Omit<StoredAgentDocument, "_id"> = {
    userId: input.userId,
    teammateId: input.teammateId,
    projectId: input.projectId,
    projectName: input.projectName?.trim() || undefined,
    title: input.title.trim(),
    content: input.content.trim(),
    taskTitle: input.taskTitle?.trim() || undefined,
    status: input.status ?? "ready_for_review",
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db
    .collection<Omit<StoredAgentDocument, "_id">>(AGENT_DOCUMENTS_COLLECTION)
    .insertOne(document);

  return serializeAgentDocument({ ...document, _id: insertResult.insertedId });
}

export async function deleteAgentDocument(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
): Promise<boolean> {
  const result = await db
    .collection(AGENT_DOCUMENTS_COLLECTION)
    .deleteOne({ _id: documentId, userId, teammateId });

  return result.deletedCount > 0;
}
