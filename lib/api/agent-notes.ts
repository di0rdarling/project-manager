import type { AgentNoteResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchAgentNotes(
  teammateId: string,
): Promise<AgentNoteResponse[]> {
  const response = await fetch(`/api/chats/agents/${teammateId}/notes`);
  return parseResponse<AgentNoteResponse[]>(response);
}

export async function createAgentNote(input: {
  teammateId: string;
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
  teammateId: string;
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

export async function deleteAgentNote(input: {
  teammateId: string;
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
