import type { PainPointResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchPainPoints(
  projectId: string,
): Promise<PainPointResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/pain-points`);
  return parseResponse<PainPointResponse[]>(response);
}

export async function createPainPoint(input: {
  projectId: string;
  title: string;
  content: string;
}): Promise<PainPointResponse> {
  const { projectId, title, content } = input;
  const response = await fetch(`/api/projects/${projectId}/pain-points`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  return parseResponse<PainPointResponse>(response);
}

export async function updatePainPoint(input: {
  projectId: string;
  painPointId: string;
  title: string;
  content: string;
}): Promise<PainPointResponse> {
  const { projectId, painPointId, title, content } = input;
  const response = await fetch(
    `/api/projects/${projectId}/pain-points/${painPointId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    },
  );

  return parseResponse<PainPointResponse>(response);
}

export async function deletePainPoint(input: {
  projectId: string;
  painPointId: string;
}): Promise<void> {
  const { projectId, painPointId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/pain-points/${painPointId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
