import type { FeatureResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchFeatures(
  projectId: string,
): Promise<FeatureResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/features`);
  return parseResponse<FeatureResponse[]>(response);
}

export async function fetchFeature(input: {
  projectId: string;
  featureId: string;
}): Promise<FeatureResponse> {
  const { projectId, featureId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/features/${featureId}`,
  );
  return parseResponse<FeatureResponse>(response);
}

export async function createFeature(input: {
  projectId: string;
  title: string;
  content: string;
  requirementIds?: string[];
}): Promise<FeatureResponse> {
  const { projectId, title, content, requirementIds = [] } = input;
  const response = await fetch(`/api/projects/${projectId}/features`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, requirementIds }),
  });

  return parseResponse<FeatureResponse>(response);
}

export async function updateFeature(input: {
  projectId: string;
  featureId: string;
  title: string;
  content: string;
  requirementIds?: string[];
}): Promise<FeatureResponse> {
  const { projectId, featureId, title, content, requirementIds = [] } = input;
  const response = await fetch(
    `/api/projects/${projectId}/features/${featureId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, requirementIds }),
    },
  );

  return parseResponse<FeatureResponse>(response);
}

export async function deleteFeature(input: {
  projectId: string;
  featureId: string;
}): Promise<void> {
  const { projectId, featureId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/features/${featureId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
