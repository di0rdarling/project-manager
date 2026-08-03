import type { Db, ObjectId } from "mongodb";
import {
  getDocumentReviewMessages,
  AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION,
} from "@/lib/agents/agent-document-review-store";
import {
  getDocumentReviewSession,
  AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION,
} from "@/lib/agents/agent-document-review-session-store";
import {
  getTaskOverviewMessages,
  AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION,
} from "@/lib/agents/agent-task-overview-store";
import {
  getOrCreateTaskOverviewSession,
  updateTaskOverviewSessionSummary,
  type AgentTaskOverviewSessionResponse,
} from "@/lib/agents/agent-task-overview-session-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type {
  AgentTaskOverviewMessageResponse,
  ChatMessageRole,
} from "@/lib/types";

export type TaskConversationKey = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
};

type TaskConversationMessageLike = {
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export function taskConversationMessageFingerprint(
  message: TaskConversationMessageLike,
): string {
  return `${message.role}\0${message.createdAt}\0${message.content}`;
}

/**
 * Merges legacy per-document review messages/sessions into the task-scoped
 * conversation store. Idempotent — safe to call on every review-chat load.
 */
export async function syncDocumentReviewIntoTaskConversation(
  db: Db,
  key: TaskConversationKey,
  documentId: ObjectId,
): Promise<void> {
  const documentMessages = await getDocumentReviewMessages(
    db,
    key.userId,
    key.teammateId,
    documentId,
  );

  const documentSession = await getDocumentReviewSession(
    db,
    key.userId,
    key.teammateId,
    documentId,
  );

  if (
    documentMessages.length === 0 &&
    !documentSession?.conversationSummary?.trim()
  ) {
    return;
  }

  const taskMessages = await getTaskOverviewMessages(
    db,
    key.userId,
    key.teammateId,
    key.projectId,
    key.taskTitle,
  );

  const existingFingerprints = new Set(
    taskMessages.map(taskConversationMessageFingerprint),
  );

  const messagesToCopy = documentMessages.filter(
    (message) =>
      !existingFingerprints.has(taskConversationMessageFingerprint(message)),
  );

  if (messagesToCopy.length > 0) {
    await db.collection(AGENT_TASK_OVERVIEW_MESSAGES_COLLECTION).insertMany(
      messagesToCopy.map((message) => ({
        userId: key.userId,
        teammateId: key.teammateId,
        projectId: key.projectId,
        taskTitle: key.taskTitle,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    );
  }

  const taskSession = await getOrCreateTaskOverviewSession(
    db,
    key,
    documentSession?.modelId ?? DEFAULT_CHAT_MODEL_ID,
  );

  const documentSummary = documentSession?.conversationSummary?.trim() || null;
  const taskSummary = taskSession.conversationSummary?.trim() || null;

  if (documentSummary && !taskSummary) {
    await updateTaskOverviewSessionSummary(
      db,
      key,
      documentSummary,
      documentSession?.updatedAt ?? new Date().toISOString(),
    );
  }

  if (documentMessages.length > 0) {
    await db.collection(AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION).deleteMany({
      userId: key.userId,
      teammateId: key.teammateId,
      documentId,
    });
  }

  if (documentSession) {
    await db.collection(AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION).deleteOne({
      userId: key.userId,
      teammateId: key.teammateId,
      documentId,
    });
  }
}

export async function getUnifiedTaskConversationMessages(
  db: Db,
  key: TaskConversationKey,
  documentId?: ObjectId,
): Promise<AgentTaskOverviewMessageResponse[]> {
  if (documentId) {
    await syncDocumentReviewIntoTaskConversation(db, key, documentId);
  }

  return getTaskOverviewMessages(
    db,
    key.userId,
    key.teammateId,
    key.projectId,
    key.taskTitle,
  );
}

export async function resolveUnifiedTaskConversationSession(
  db: Db,
  key: TaskConversationKey,
  documentId: ObjectId | null,
  defaultModelId: ChatModelId,
): Promise<AgentTaskOverviewSessionResponse> {
  if (documentId) {
    await syncDocumentReviewIntoTaskConversation(db, key, documentId);
  }

  return getOrCreateTaskOverviewSession(db, key, defaultModelId);
}
