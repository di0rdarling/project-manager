import type { Db, ObjectId } from "mongodb";
import type { ChatModelId } from "@/lib/chats/chat-models";
import { toIsoString } from "@/lib/dates";
import type { DashboardDigestResponse } from "@/lib/types";

export const DASHBOARD_DIGESTS_COLLECTION = "dashboard_digests";

export type StoredDashboardDigest = {
  userId: ObjectId;
  digest: string;
  suggestedAction: string;
  modelId: ChatModelId;
  generatedAt: string | Date;
  updatedAt: string | Date;
};

export function serializeDashboardDigest(
  stored: StoredDashboardDigest,
): DashboardDigestResponse {
  return {
    digest: stored.digest,
    suggestedAction: stored.suggestedAction,
    generatedAt: toIsoString(stored.generatedAt),
  };
}

export async function getDashboardDigest(
  db: Db,
  userId: ObjectId,
): Promise<StoredDashboardDigest | null> {
  return db
    .collection<StoredDashboardDigest>(DASHBOARD_DIGESTS_COLLECTION)
    .findOne({ userId });
}

export async function upsertDashboardDigest(
  db: Db,
  userId: ObjectId,
  input: {
    digest: string;
    suggestedAction: string;
    modelId: ChatModelId;
  },
  generatedAt: string = new Date().toISOString(),
): Promise<StoredDashboardDigest> {
  const record: StoredDashboardDigest = {
    userId,
    digest: input.digest,
    suggestedAction: input.suggestedAction,
    modelId: input.modelId,
    generatedAt,
    updatedAt: generatedAt,
  };

  await db
    .collection<StoredDashboardDigest>(DASHBOARD_DIGESTS_COLLECTION)
    .updateOne({ userId }, { $set: record }, { upsert: true });

  return record;
}
