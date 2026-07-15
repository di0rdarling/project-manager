import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { UserMemoryDraft } from "@/lib/agents/user-memory-json";
import { EMPTY_USER_MEMORY_DRAFT } from "@/lib/agents/user-memory-json";
import type { UserMemoryDecision, UserMemoryThread } from "@/lib/types";

export const USER_MEMORIES_COLLECTION = "agent_user_memories";

export type StoredUserMemory = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  mostRecently: string | null;
  openThreads: UserMemoryThread[];
  decisions: UserMemoryDecision[];
  stableContext: string[];
  updatedAt: string | Date;
};

/**
 * The structured, user-facing counterpart to the agent's own first-person
 * Memory (see agent-memory-store.ts). Shown on the agent profile page as
 * "Most recently", "Open threads", "Key decisions", and "Stable context".
 *
 * Updated automatically after each chat message once that chat's
 * conversation summary refreshes (incremental merge). Can also be fully
 * rebuilt from the profile page Generate / Regenerate action.
 */
export async function getUserMemory(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Promise<StoredUserMemory | null> {
  return db
    .collection<StoredUserMemory>(USER_MEMORIES_COLLECTION)
    .findOne({ userId, teammateId });
}

export async function upsertUserMemory(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  draft: UserMemoryDraft,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredUserMemory> {
  const record: StoredUserMemory = {
    userId,
    teammateId,
    mostRecently: draft.mostRecently,
    openThreads: draft.openThreads,
    decisions: draft.decisions,
    stableContext: draft.stableContext,
    updatedAt,
  };

  await db.collection<StoredUserMemory>(USER_MEMORIES_COLLECTION).updateOne(
    { userId, teammateId },
    { $set: record },
    { upsert: true },
  );

  return record;
}

export async function clearUserMemory(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredUserMemory> {
  return upsertUserMemory(db, userId, teammateId, EMPTY_USER_MEMORY_DRAFT, updatedAt);
}
