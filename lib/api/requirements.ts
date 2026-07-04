import type { RequirementResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchRequirements(
  projectId: string,
): Promise<RequirementResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/requirements`);
  return parseResponse<RequirementResponse[]>(response);
}

export async function createRequirement(input: {
  projectId: string;
  title: string;
  content: string;
}): Promise<RequirementResponse> {
  const { projectId, title, content } = input;
  const response = await fetch(`/api/projects/${projectId}/requirements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  return parseResponse<RequirementResponse>(response);
}

export async function updateRequirement(input: {
  projectId: string;
  requirementId: string;
  title: string;
  content: string;
}): Promise<RequirementResponse> {
  const { projectId, requirementId, title, content } = input;
  const response = await fetch(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    },
  );

  return parseResponse<RequirementResponse>(response);
}

export async function deleteRequirement(input: {
  projectId: string;
  requirementId: string;
}): Promise<void> {
  const { projectId, requirementId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
