import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";
import type { ChatMessageRole } from "@/lib/types";
import type { AgentDocumentReviewMessageResponse } from "@/lib/types";

export const AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION =
  "agent_document_review_messages";

type StoredDocumentReviewMessage = {
  _id: ObjectId;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  documentId: ObjectId;
  role: ChatMessageRole;
  content: string;
  createdAt: string | Date;
};

function serializeDocumentReviewMessage(
  message: StoredDocumentReviewMessage,
): AgentDocumentReviewMessageResponse {
  return {
    _id: message._id.toString(),
    role: message.role,
    content: message.content,
    createdAt: toIsoString(message.createdAt),
  };
}

export async function getDocumentReviewMessages(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
): Promise<AgentDocumentReviewMessageResponse[]> {
  const messages = await db
    .collection<StoredDocumentReviewMessage>(
      AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION,
    )
    .find({ userId, teammateId, documentId })
    .sort({ createdAt: 1 })
    .toArray();

  return messages.map(serializeDocumentReviewMessage);
}

type InsertDocumentReviewMessagesInput = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  documentId: ObjectId;
  userContent: string;
  assistantContent: string;
  createdAt: string;
};

export async function insertDocumentReviewMessages(
  db: Db,
  input: InsertDocumentReviewMessagesInput,
): Promise<{
  userMessage: AgentDocumentReviewMessageResponse;
  assistantMessage: AgentDocumentReviewMessageResponse;
}> {
  const base = {
    userId: input.userId,
    teammateId: input.teammateId,
    documentId: input.documentId,
    createdAt: input.createdAt,
  };

  const userInsert = await db
    .collection<Omit<StoredDocumentReviewMessage, "_id">>(
      AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION,
    )
    .insertOne({
      ...base,
      role: "user",
      content: input.userContent,
    });

  const assistantInsert = await db
    .collection<Omit<StoredDocumentReviewMessage, "_id">>(
      AGENT_DOCUMENT_REVIEW_MESSAGES_COLLECTION,
    )
    .insertOne({
      ...base,
      role: "model",
      content: input.assistantContent,
    });

  return {
    userMessage: serializeDocumentReviewMessage({
      _id: userInsert.insertedId,
      ...base,
      role: "user",
      content: input.userContent,
    }),
    assistantMessage: serializeDocumentReviewMessage({
      _id: assistantInsert.insertedId,
      ...base,
      role: "model",
      content: input.assistantContent,
    }),
  };
}
