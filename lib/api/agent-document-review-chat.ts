import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { parseResponse } from "@/lib/api/response";
import type {
  AgentDocumentReviewChatResponse,
  SendDocumentReviewMessageResponse,
  UpdateDocumentReviewChatResponse,
} from "@/lib/types";

export async function fetchDocumentReviewChat(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<AgentDocumentReviewChatResponse> {
  const { teammateId, documentId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}/review-chat`,
  );
  return parseResponse<AgentDocumentReviewChatResponse>(response);
}

export async function sendDocumentReviewMessage(input: {
  teammateId: ChatTeammateId;
  documentId: string;
  content: string;
}): Promise<SendDocumentReviewMessageResponse> {
  const { teammateId, documentId, content } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}/review-chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  return parseResponse<SendDocumentReviewMessageResponse>(response);
}

export async function updateDocumentReviewChat(input: {
  teammateId: ChatTeammateId;
  documentId: string;
  modelId?: ChatModelId;
  reasoningEffort?: KimiReasoningEffort | null;
}): Promise<UpdateDocumentReviewChatResponse> {
  const { teammateId, documentId, modelId, reasoningEffort } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}/review-chat`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, reasoningEffort }),
    },
  );

  return parseResponse<UpdateDocumentReviewChatResponse>(response);
}
