import { toIsoString } from "@/lib/dates";
import { getStoredRequirementIds } from "@/lib/feature-requirements";
import type { Feature, FeatureResponse } from "@/lib/types";

export type StoredFeature = Omit<
  Feature,
  "_id" | "projectId" | "requirementIds" | "createdAt" | "updatedAt"
> & {
  _id: Feature["_id"];
  projectId: Feature["projectId"];
  requirementIds?: Feature["requirementIds"];
  /** @deprecated Legacy single-link field; read-only for migration. */
  requirementId?: Feature["requirementIds"][number] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function serializeFeature(feature: StoredFeature): FeatureResponse {
  return {
    _id: feature._id.toString(),
    userId: feature.userId.toString(),
    projectId: feature.projectId.toString(),
    title: typeof feature.title === "string" ? feature.title : "",
    content: feature.content,
    requirementIds: getStoredRequirementIds(feature).map((id) => id.toString()),
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
