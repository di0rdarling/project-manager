// One-time (idempotent) migration: introduces the `users` collection and
// stamps every pre-existing document with a `userId`, so all data created
// before accounts existed is attached to one "legacy" account.
//
// Usage:
//   node --env-file=.env scripts/migrate-add-users.mjs
//
// Configure the legacy account via env vars (both optional):
//   LEGACY_USER_EMAIL    defaults to "legacy@a-star.tech"
//   LEGACY_USER_PASSWORD defaults to a randomly generated password, printed
//                        once so you can change it after signing in.
//   LEGACY_USER_NAME     optional display name for the account (defaults to null)
//
// Safe to re-run: it only touches documents missing `userId` and upserts
// the legacy user by email.

import { randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const COLLECTIONS_TO_STAMP = [
  "projects",
  "requirements",
  "features",
  "notes",
  "painPoints",
  "challenges",
  "tools",
  "coreUsers",
  "domainKnowledge",
  "chats",
  "chat_messages",
  "agent_notes",
  "agent_memories",
];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function ensureLegacyUser(db) {
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });

  const email = normalizeEmail(
    process.env.LEGACY_USER_EMAIL || "legacy@a-star.tech",
  );

  const existing = await users.findOne({ email });
  if (existing) {
    console.log(`Legacy user already exists: ${email} (${existing._id})`);
    return existing._id;
  }

  const generatedPassword = randomBytes(9).toString("base64url");
  const password = process.env.LEGACY_USER_PASSWORD || generatedPassword;
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const result = await users.insertOne({
    email,
    passwordHash,
    name: process.env.LEGACY_USER_NAME?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created legacy user: ${email} (${result.insertedId})`);
  if (!process.env.LEGACY_USER_PASSWORD) {
    console.log(
      `Generated temporary password (copy this now, it will not be shown again): ${password}`,
    );
  }

  return result.insertedId;
}

async function stampCollection(db, name, userId) {
  const result = await db
    .collection(name)
    .updateMany({ userId: { $exists: false } }, { $set: { userId } });

  console.log(
    `  ${name}: ${result.matchedCount} matched, ${result.modifiedCount} updated`,
  );
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const legacyUserId = await ensureLegacyUser(db);
    const userIdAsObjectId =
      legacyUserId instanceof ObjectId ? legacyUserId : new ObjectId(legacyUserId);

    console.log("\nStamping existing documents with the legacy userId...");
    for (const collectionName of COLLECTIONS_TO_STAMP) {
      await stampCollection(db, collectionName, userIdAsObjectId);
    }

    console.log("\nMigration complete.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
