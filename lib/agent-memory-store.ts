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
 * Each other teammate's already-generated first-person "Memory" (see the
 * agent profile page). This is a single condensed blurb per teammate rather
 * than their full chat history, which keeps cross-teammate context compact
 * regardless of how many conversations a teammate has had.
 *
 * Note: a teammate's memory only reflects what it looked like the last time
 * it was generated/regenerated on their profile page — it is not
 * regenerated automatically after every message.
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
