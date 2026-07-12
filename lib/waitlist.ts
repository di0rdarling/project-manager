import type { Db } from "mongodb";
import { normalizeEmail } from "@/lib/users";

const WAITLIST_COLLECTION = "waitlist";

export type WaitlistEntry = {
  _id: import("mongodb").ObjectId;
  email: string;
  createdAt: Date;
};

export async function ensureWaitlistIndexes(db: Db) {
  await db
    .collection(WAITLIST_COLLECTION)
    .createIndex({ email: 1 }, { unique: true });
}

export async function findWaitlistEntryByEmail(db: Db, email: string) {
  return db.collection<WaitlistEntry>(WAITLIST_COLLECTION).findOne({
    email: normalizeEmail(email),
  });
}

export async function createWaitlistEntry(db: Db, email: string) {
  const result = await db
    .collection<Omit<WaitlistEntry, "_id">>(WAITLIST_COLLECTION)
    .insertOne({
      email: normalizeEmail(email),
      createdAt: new Date(),
    });

  return result.insertedId;
}
