import type { ProjectResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function generateProjectSummary(
  projectId: string,
): Promise<ProjectResponse> {
  const response = await fetch(`/api/projects/${projectId}/summary`, {
    method: "POST",
  });

  return parseResponse<ProjectResponse>(response);
}

export async function deleteProjectSummary(
  projectId: string,
): Promise<ProjectResponse> {
  const response = await fetch(`/api/projects/${projectId}/summary`, {
    method: "DELETE",
  });

  return parseResponse<ProjectResponse>(response);
}
