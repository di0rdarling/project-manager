import { ObjectId, type Db } from "mongodb";
import {
  DEFAULT_CHAT_MODEL_ID,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import { toIsoString } from "@/lib/dates";
import type { User, UserResponse, UserSubscription } from "@/lib/types";

const DEFAULT_USER_SUBSCRIPTION: UserSubscription = "free";

export function normalizeUserSubscription(
  subscription: UserSubscription | null | undefined,
): UserSubscription {
  return subscription === "premium" ? "premium" : DEFAULT_USER_SUBSCRIPTION;
}

export const USERS_COLLECTION = "users";

export type StoredUser = Omit<User, "createdAt" | "updatedAt" | "subscription"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  subscription?: UserSubscription;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function serializeUser(user: StoredUser): UserResponse {
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    subscription: normalizeUserSubscription(user.subscription),
    agentTaskGenerationModelId: user.agentTaskGenerationModelId ?? null,
    dashboardDigestModelId: user.dashboardDigestModelId ?? null,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
  };
}

export function getUserAgentTaskGenerationModelId(
  user: Pick<StoredUser, "agentTaskGenerationModelId"> | null | undefined,
): ChatModelId {
  return normalizeChatModelId(
    user?.agentTaskGenerationModelId ?? DEFAULT_CHAT_MODEL_ID,
  );
}

export function getUserDashboardDigestModelId(
  user: Pick<StoredUser, "dashboardDigestModelId"> | null | undefined,
): ChatModelId {
  if (user?.dashboardDigestModelId) {
    return normalizeChatModelId(user.dashboardDigestModelId);
  }

  const envModel =
    process.env.GEMINI_DASHBOARD_MODEL ?? process.env.GEMINI_MODEL;

  return normalizeChatModelId(envModel ?? DEFAULT_CHAT_MODEL_ID);
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
    subscription: DEFAULT_USER_SUBSCRIPTION,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<Omit<User, "_id">>(USERS_COLLECTION)
    .insertOne(user);

  return { ...user, _id: result.insertedId };
}

export async function updateUserName(
  db: Db,
  userId: ObjectId,
  name: string | null,
): Promise<StoredUser | null> {
  return updateUserFields(db, userId, { name });
}

type UserFieldUpdates = {
  name?: string | null;
  agentTaskGenerationModelId?: ChatModelId | null;
  dashboardDigestModelId?: ChatModelId | null;
  subscription?: UserSubscription;
};

export async function updateUserFields(
  db: Db,
  userId: ObjectId,
  updates: UserFieldUpdates,
): Promise<StoredUser | null> {
  const setUpdates: Partial<StoredUser> = {
    updatedAt: new Date().toISOString(),
  };

  if ("name" in updates) {
    setUpdates.name = updates.name ?? null;
  }

  if ("agentTaskGenerationModelId" in updates) {
    setUpdates.agentTaskGenerationModelId =
      updates.agentTaskGenerationModelId ?? null;
  }

  if ("dashboardDigestModelId" in updates) {
    setUpdates.dashboardDigestModelId = updates.dashboardDigestModelId ?? null;
  }

  if ("subscription" in updates) {
    setUpdates.subscription = updates.subscription;
  }

  const result = await db
    .collection<StoredUser>(USERS_COLLECTION)
    .findOneAndUpdate({ _id: userId }, { $set: setUpdates }, { returnDocument: "after" });

  return result ?? null;
}
