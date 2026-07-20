import type { NoteFolderResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchNoteFolders(
  projectId: string,
): Promise<NoteFolderResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/note-folders`);
  return parseResponse<NoteFolderResponse[]>(response);
}

export async function createNoteFolder(input: {
  projectId: string;
  name: string;
  parentFolderId?: string | null;
}): Promise<NoteFolderResponse> {
  const { projectId, name, parentFolderId } = input;
  const response = await fetch(`/api/projects/${projectId}/note-folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentFolderId }),
  });

  return parseResponse<NoteFolderResponse>(response);
}

export async function updateNoteFolder(input: {
  projectId: string;
  folderId: string;
  name?: string;
  parentFolderId?: string | null;
}): Promise<NoteFolderResponse> {
  const { projectId, folderId, name, parentFolderId } = input;
  const body: { name?: string; parentFolderId?: string | null } = {};

  if (name !== undefined) {
    body.name = name;
  }

  if (parentFolderId !== undefined) {
    body.parentFolderId = parentFolderId;
  }

  const response = await fetch(
    `/api/projects/${projectId}/note-folders/${folderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  return parseResponse<NoteFolderResponse>(response);
}

export async function deleteNoteFolder(input: {
  projectId: string;
  folderId: string;
}): Promise<void> {
  const { projectId, folderId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/note-folders/${folderId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
