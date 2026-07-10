import { ObjectId } from "mongodb";
import type getClientPromise from "@/lib/mongodb";
import type { Feature } from "@/lib/types";

export type StoredFeatureRequirementFields = {
  requirementIds?: Feature["requirementIds"];
  /** @deprecated Legacy single-link field; read-only for migration. */
  requirementId?: Feature["requirementIds"][number] | null;
};

export function getStoredRequirementIds(
  feature: StoredFeatureRequirementFields,
): ObjectId[] {
  if (Array.isArray(feature.requirementIds) && feature.requirementIds.length > 0) {
    return feature.requirementIds;
  }

  if (feature.requirementId) {
    return [feature.requirementId];
  }

  return [];
}

export function parseRequirementIds(
  value: unknown,
): { requirementIds: ObjectId[] } | { error: Response } {
  if (value === null || value === undefined) {
    return { requirementIds: [] };
  }

  if (!Array.isArray(value)) {
    return {
      error: Response.json(
        { error: "Requirement ids must be an array" },
        { status: 400 },
      ),
    };
  }

  const requirementIds: ObjectId[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (item === null || item === undefined || item === "") {
      continue;
    }

    if (typeof item !== "string" || !ObjectId.isValid(item)) {
      return {
        error: Response.json(
          { error: "Invalid requirement id" },
          { status: 400 },
        ),
      };
    }

    if (seen.has(item)) {
      continue;
    }

    seen.add(item);
    requirementIds.push(new ObjectId(item));
  }

  return { requirementIds };
}

export async function validateRequirementLinks(
  client: Awaited<ReturnType<typeof getClientPromise>>,
  userId: ObjectId,
  projectId: ObjectId,
  requirementIds: ObjectId[],
): Promise<Response | null> {
  if (requirementIds.length === 0) {
    return null;
  }

  const foundCount = await client
    .db()
    .collection("requirements")
    .countDocuments({
      _id: { $in: requirementIds },
      projectId,
      userId,
    });

  if (foundCount !== requirementIds.length) {
    return Response.json(
      { error: "One or more linked requirements were not found" },
      { status: 400 },
    );
  }

  return null;
}

export function getLinkedRequirementTitles(
  requirementIds: ObjectId[],
  requirementTitles: Map<string, string>,
): string[] {
  return requirementIds.map(
    (requirementId) =>
      requirementTitles.get(requirementId.toString()) ?? "Unknown requirement",
  );
}
