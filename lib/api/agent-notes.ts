import type { AgentNoteResponse } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { parseResponse } from "@/lib/api/response";

export async function fetchAgentNotes(
  teammateId: ChatTeammateId,
): Promise<AgentNoteResponse[]> {
  const response = await fetch(`/api/chats/agents/${teammateId}/notes`);
  return parseResponse<AgentNoteResponse[]>(response);
}

export async function fetchAgentNote(input: {
  teammateId: ChatTeammateId;
  noteId: string;
}): Promise<AgentNoteResponse> {
  const { teammateId, noteId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/notes/${noteId}`,
  );
  return parseResponse<AgentNoteResponse>(response);
}

export async function createAgentNote(input: {
  teammateId: ChatTeammateId;
  title: string;
  content: string;
}): Promise<AgentNoteResponse> {
  const { teammateId, title, content } = input;
  const response = await fetch(`/api/chats/agents/${teammateId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  return parseResponse<AgentNoteResponse>(response);
}

export async function updateAgentNote(input: {
  teammateId: ChatTeammateId;
  noteId: string;
  title: string;
  content: string;
}): Promise<AgentNoteResponse> {
  const { teammateId, noteId, title, content } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/notes/${noteId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    },
  );

  return parseResponse<AgentNoteResponse>(response);
}

export async function shareAgentNote(input: {
  teammateId: ChatTeammateId;
  noteId: string;
  sharedWithTeammateIds: ChatTeammateId[];
}): Promise<AgentNoteResponse> {
  const { teammateId, noteId, sharedWithTeammateIds } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/notes/${noteId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedWithTeammateIds }),
    },
  );

  return parseResponse<AgentNoteResponse>(response);
}

export async function deleteAgentNote(input: {
  teammateId: ChatTeammateId;
  noteId: string;
}): Promise<void> {
  const { teammateId, noteId } = input;
  const response = await fetch(
    `/api/chats/agents/${teammateId}/notes/${noteId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
