import { toIsoString } from "@/lib/dates";
import type { Feature, FeatureResponse } from "@/lib/types";

export type StoredFeature = Omit<
  Feature,
  "_id" | "projectId" | "requirementId" | "createdAt" | "updatedAt"
> & {
  _id: Feature["_id"];
  projectId: Feature["projectId"];
  requirementId: Feature["requirementId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function serializeFeature(feature: StoredFeature): FeatureResponse {
  return {
    _id: feature._id.toString(),
    projectId: feature.projectId.toString(),
    title: typeof feature.title === "string" ? feature.title : "",
    content: feature.content,
    requirementId: feature.requirementId
      ? feature.requirementId.toString()
      : null,
    aiSummary:
      typeof feature.aiSummary === "string" && feature.aiSummary.trim()
        ? feature.aiSummary
        : null,
    createdAt: toIsoString(feature.createdAt),
    updatedAt: feature.updatedAt
      ? toIsoString(feature.updatedAt)
      : toIsoString(feature.createdAt),
  };
}
