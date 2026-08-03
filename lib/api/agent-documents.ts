import type {
  AgentDocumentResponse,
  RejectAgentDocumentResponse,
  SaveAgentDocumentAsProjectNoteResponse,
} from "@/lib/types";
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

async function updateAgentDocumentReviewStatus(input: {
  teammateId: ChatTeammateId;
  documentId: string;
  status: "accepted" | "rejected";
}): Promise<AgentDocumentResponse> {
  const { teammateId, documentId, status } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return parseResponse<AgentDocumentResponse>(response);
}

export async function acceptAgentDocument(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<AgentDocumentResponse> {
  return updateAgentDocumentReviewStatus({ ...input, status: "accepted" });
}

export async function rejectAgentDocument(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<RejectAgentDocumentResponse> {
  const { teammateId, documentId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    },
  );
  return parseResponse<RejectAgentDocumentResponse>(response);
}

export async function saveAgentDocumentAsProjectNote(input: {
  teammateId: ChatTeammateId;
  documentId: string;
}): Promise<SaveAgentDocumentAsProjectNoteResponse> {
  const { teammateId, documentId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/documents/${documentId}/save-as-note`,
    { method: "POST" },
  );
  return parseResponse<SaveAgentDocumentAsProjectNoteResponse>(response);
}
