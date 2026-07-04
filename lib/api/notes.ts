import type { NoteResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchNotes(projectId: string): Promise<NoteResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/notes`);
  return parseResponse<NoteResponse[]>(response);
}

export async function createNote(input: {
  projectId: string;
  content: string;
}): Promise<NoteResponse> {
  const { projectId, content } = input;
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return parseResponse<NoteResponse>(response);
}

export async function deleteNote(input: {
  projectId: string;
  noteId: string;
}): Promise<void> {
  const { projectId, noteId } = input;
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
