import type { Db, ObjectId } from "mongodb";
import {
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import {
  DEFAULT_KIMI_REASONING_EFFORT,
  isKimiReasoningEffort,
  type KimiReasoningEffort,
} from "@/lib/chats/kimi-reasoning-effort";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";

export const AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION =
  "agent_document_review_sessions";

type StoredDocumentReviewSession = {
  _id: ObjectId;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  documentId: ObjectId;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort | null;
  conversationSummary: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type AgentDocumentReviewSessionResponse = {
  modelId: ChatModelId;
  reasoningEffort: KimiReasoningEffort | null;
  conversationSummary: string | null;
  updatedAt: string;
};

function serializeDocumentReviewSession(
  session: StoredDocumentReviewSession,
): AgentDocumentReviewSessionResponse {
  return {
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort ?? null,
    conversationSummary: session.conversationSummary,
    updatedAt: toIsoString(session.updatedAt),
  };
}

export async function getDocumentReviewSession(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
): Promise<AgentDocumentReviewSessionResponse | null> {
  const session = await db
    .collection<StoredDocumentReviewSession>(
      AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION,
    )
    .findOne({ userId, teammateId, documentId });

  return session ? serializeDocumentReviewSession(session) : null;
}

export async function getOrCreateDocumentReviewSession(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
  defaultModelId: ChatModelId = DEFAULT_CHAT_MODEL_ID,
): Promise<AgentDocumentReviewSessionResponse> {
  const existing = await db
    .collection<StoredDocumentReviewSession>(
      AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION,
    )
    .findOne({ userId, teammateId, documentId });

  if (existing) {
    return serializeDocumentReviewSession(existing);
  }

  const now = new Date().toISOString();
  const session: Omit<StoredDocumentReviewSession, "_id"> = {
    userId,
    teammateId,
    documentId,
    modelId: defaultModelId,
    reasoningEffort:
      defaultModelId === "kimi-k3" ? DEFAULT_KIMI_REASONING_EFFORT : null,
    conversationSummary: null,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db
    .collection<Omit<StoredDocumentReviewSession, "_id">>(
      AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION,
    )
    .insertOne(session);

  return serializeDocumentReviewSession({
    ...session,
    _id: insertResult.insertedId,
  });
}

export async function updateDocumentReviewSessionSettings(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
  settings: {
    modelId?: ChatModelId;
    reasoningEffort?: KimiReasoningEffort | null;
  },
  defaultModelId: ChatModelId = DEFAULT_CHAT_MODEL_ID,
): Promise<AgentDocumentReviewSessionResponse> {
  const session = await getOrCreateDocumentReviewSession(
    db,
    userId,
    teammateId,
    documentId,
    defaultModelId,
  );

  const nextModelId = settings.modelId ?? session.modelId;
  const nextReasoningEffort =
    settings.reasoningEffort !== undefined
      ? settings.reasoningEffort
      : nextModelId === "kimi-k3"
        ? (session.reasoningEffort ?? DEFAULT_KIMI_REASONING_EFFORT)
        : null;

  const now = new Date().toISOString();

  await db.collection(AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION).updateOne(
    { userId, teammateId, documentId },
    {
      $set: {
        modelId: nextModelId,
        reasoningEffort: nextReasoningEffort,
        updatedAt: now,
      },
    },
  );

  return {
    ...session,
    modelId: nextModelId,
    reasoningEffort: nextReasoningEffort,
    updatedAt: now,
  };
}

export async function updateDocumentReviewSessionSummary(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
  conversationSummary: string,
  updatedAt: string = new Date().toISOString(),
): Promise<void> {
  await db.collection(AGENT_DOCUMENT_REVIEW_SESSIONS_COLLECTION).updateOne(
    { userId, teammateId, documentId },
    {
      $set: {
        conversationSummary,
        updatedAt,
      },
    },
  );
}

export function parseDocumentReviewModelId(value: unknown): ChatModelId | null {
  return isChatModelId(value) ? value : null;
}

export function parseDocumentReviewReasoningEffort(
  value: unknown,
): KimiReasoningEffort | null {
  return isKimiReasoningEffort(value) ? value : null;
}
