import type { CoreUserResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchCoreUsers(
  projectId: string,
): Promise<CoreUserResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/core-users`);
  return parseResponse<CoreUserResponse[]>(response);
}

export async function createCoreUser(input: {
  projectId: string;
  name: string;
  role: string;
  content: string;
}): Promise<CoreUserResponse> {
  const { projectId, name, role, content } = input;
  const response = await fetch(`/api/projects/${projectId}/core-users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role, content }),
  });

  return parseResponse<CoreUserResponse>(response);
}

export async function updateCoreUser(input: {
  projectId: string;
  coreUserId: string;
  name: string;
  role: string;
  content: string;
}): Promise<CoreUserResponse> {
  const { projectId, coreUserId, name, role, content } = input;
  const response = await fetch(
    `/api/projects/${projectId}/core-users/${coreUserId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, content }),
    },
  );

  return parseResponse<CoreUserResponse>(response);
}

export async function deleteCoreUser(input: {
  projectId: string;
  coreUserId: string;
}): Promise<void> {
  const { projectId, coreUserId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/core-users/${coreUserId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
