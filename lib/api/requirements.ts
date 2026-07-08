import type { RequirementPriority, RequirementResponse } from "@/lib/types";
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
  priority?: RequirementPriority | null;
}): Promise<RequirementResponse> {
  const { projectId, title, content, priority = null } = input;
  const response = await fetch(`/api/projects/${projectId}/requirements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, priority }),
  });

  return parseResponse<RequirementResponse>(response);
}

export async function updateRequirement(input: {
  projectId: string;
  requirementId: string;
  title: string;
  content: string;
  priority?: RequirementPriority | null;
}): Promise<RequirementResponse> {
  const { projectId, requirementId, title, content, priority = null } = input;
  const response = await fetch(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, priority }),
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
