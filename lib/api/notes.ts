import type { NoteResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchNotes(
  projectId: string,
  featureId?: string | null,
): Promise<NoteResponse[]> {
  const params =
    featureId !== undefined && featureId !== null
      ? `?featureId=${encodeURIComponent(featureId)}`
      : "";
  const response = await fetch(`/api/projects/${projectId}/notes${params}`);
  return parseResponse<NoteResponse[]>(response);
}

export async function fetchNote(input: {
  projectId: string;
  noteId: string;
}): Promise<NoteResponse> {
  const { projectId, noteId } = input;
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`);
  return parseResponse<NoteResponse>(response);
}

export async function createNote(input: {
  projectId: string;
  title: string;
  content: string;
  featureId?: string | null;
}): Promise<NoteResponse> {
  const { projectId, title, content, featureId } = input;
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, featureId }),
  });

  return parseResponse<NoteResponse>(response);
}

export async function updateNote(input: {
  projectId: string;
  noteId: string;
  title: string;
  content: string;
}): Promise<NoteResponse> {
  const { projectId, noteId, title, content } = input;
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  return parseResponse<NoteResponse>(response);
}

export async function deleteNote(input: {
  projectId: string;
  noteId: string;
  featureId?: string | null;
}): Promise<void> {
  const { projectId, noteId } = input;
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
