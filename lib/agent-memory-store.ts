import type { Db, WithId } from "mongodb";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import { toIsoString } from "@/lib/dates";

export const AGENT_MEMORIES_COLLECTION = "agent_memories";

export type StoredAgentMemory = {
  teammateId: ChatTeammateId;
  memory: string | null;
  updatedAt: string | Date;
};

export type OtherTeammateMemory = {
  teammateId: ChatTeammateId;
  memory: string;
  updatedAt: string;
};

/**
 * Each other teammate's compact first-person Memory (see the agent profile
 * page). This is a capped distillate of durable facts — decisions,
 * preferences, open loops — rather than a full retelling of every chat.
 *
 * Memories are updated automatically after each chat message once that
 * chat's conversation summary refreshes (incremental merge). They can also
 * be fully rebuilt from the profile page Generate / Regenerate action.
 */
export async function getOtherTeammatesMemories(
  db: Db,
  currentTeammateId: ChatTeammateId,
): Promise<OtherTeammateMemory[]> {
  const records = await db
    .collection<StoredAgentMemory>(AGENT_MEMORIES_COLLECTION)
    .find({ teammateId: { $ne: currentTeammateId } })
    .toArray();

  return records
    .filter(
      (
        record,
      ): record is WithId<StoredAgentMemory> & { memory: string } =>
        typeof record.memory === "string" && record.memory.trim().length > 0,
    )
    .map((record) => ({
      teammateId: isChatTeammateId(record.teammateId)
        ? record.teammateId
        : DEFAULT_CHAT_TEAMMATE_ID,
      memory: record.memory.trim(),
      updatedAt: toIsoString(record.updatedAt),
    }));
}

export async function getAgentMemory(
  db: Db,
  teammateId: ChatTeammateId,
): Promise<StoredAgentMemory | null> {
  return db
    .collection<StoredAgentMemory>(AGENT_MEMORIES_COLLECTION)
    .findOne({ teammateId });
}

export async function upsertAgentMemory(
  db: Db,
  teammateId: ChatTeammateId,
  memory: string | null,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredAgentMemory> {
  const record: StoredAgentMemory = {
    teammateId,
    memory,
    updatedAt,
  };

  await db.collection<StoredAgentMemory>(AGENT_MEMORIES_COLLECTION).updateOne(
    { teammateId },
    { $set: record },
    { upsert: true },
  );

  return record;
}
