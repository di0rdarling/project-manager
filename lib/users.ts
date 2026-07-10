import { ObjectId, type Db } from "mongodb";
import { toIsoString } from "@/lib/dates";
import type { User, UserResponse } from "@/lib/types";

export const USERS_COLLECTION = "users";

export type StoredUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function serializeUser(user: StoredUser): UserResponse {
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
  };
}

export async function ensureUserIndexes(db: Db): Promise<void> {
  await db
    .collection(USERS_COLLECTION)
    .createIndex({ email: 1 }, { unique: true });
}

export function findUserByEmail(
  db: Db,
  email: string,
): Promise<StoredUser | null> {
  return db
    .collection<StoredUser>(USERS_COLLECTION)
    .findOne({ email: normalizeEmail(email) });
}

export function findUserById(
  db: Db,
  userId: ObjectId,
): Promise<StoredUser | null> {
  return db.collection<StoredUser>(USERS_COLLECTION).findOne({ _id: userId });
}

export async function createUser(
  db: Db,
  input: { email: string; passwordHash: string; name?: string | null },
): Promise<StoredUser> {
  const now = new Date().toISOString();
  const user: Omit<User, "_id"> = {
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<Omit<User, "_id">>(USERS_COLLECTION)
    .insertOne(user);

  return { ...user, _id: result.insertedId };
}
