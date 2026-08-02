import type { AgentDocumentResponse } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { parseResponse } from "@/lib/api/response";

export async function fetchAgentDocuments(
  teammateId: ChatTeammateId,
): Promise<AgentDocumentResponse[]> {
  const response = await fetch(`/api/chats/agents/${teammateId}/documents`);
  return parseResponse<AgentDocumentResponse[]>(response);
}

export async function fetchAgentDocument(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<AgentDocumentResponse> {
  const { teammateId, documentId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}`,
  );
  return parseResponse<AgentDocumentResponse>(response);
}

export async function acceptAgentDocument(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<AgentDocumentResponse> {
  const { teammateId, documentId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    },
  );
  return parseResponse<AgentDocumentResponse>(response);
}
