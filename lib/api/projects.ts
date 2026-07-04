import type { ProjectResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchProjects(): Promise<ProjectResponse[]> {
  const response = await fetch("/api/projects");
  return parseResponse<ProjectResponse[]>(response);
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<ProjectResponse> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<ProjectResponse>(response);
}

export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
