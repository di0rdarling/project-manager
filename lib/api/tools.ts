import type { ToolResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchTools(projectId: string): Promise<ToolResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/tools`);
  return parseResponse<ToolResponse[]>(response);
}

export async function createTool(input: {
  projectId: string;
  name: string;
  content: string;
}): Promise<ToolResponse> {
  const { projectId, name, content } = input;
  const response = await fetch(`/api/projects/${projectId}/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, content }),
  });

  return parseResponse<ToolResponse>(response);
}

export async function updateTool(input: {
  projectId: string;
  toolId: string;
  name: string;
  content: string;
}): Promise<ToolResponse> {
  const { projectId, toolId, name, content } = input;
  const response = await fetch(`/api/projects/${projectId}/tools/${toolId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, content }),
  });

  return parseResponse<ToolResponse>(response);
}

export async function deleteTool(input: {
  projectId: string;
  toolId: string;
}): Promise<void> {
  const { projectId, toolId } = input;
  const response = await fetch(`/api/projects/${projectId}/tools/${toolId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
