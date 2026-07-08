import type { FeatureResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

type FeatureSummaryInput = {
  projectId: string;
  featureId: string;
};

export async function generateFeatureSummary(
  input: FeatureSummaryInput,
): Promise<FeatureResponse> {
  const { projectId, featureId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/features/${featureId}/summary`,
    {
      method: "POST",
    },
  );

  return parseResponse<FeatureResponse>(response);
}

export async function deleteFeatureSummary(
  input: FeatureSummaryInput,
): Promise<FeatureResponse> {
  const { projectId, featureId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/features/${featureId}/summary`,
    {
      method: "DELETE",
    },
  );

  return parseResponse<FeatureResponse>(response);
}
