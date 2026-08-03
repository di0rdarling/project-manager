// One-time (idempotent) migration: backfills `subscription: "free"` on every
// user document that does not already have the field.
//
// Usage:
//   node --env-file=.env scripts/migrate-add-user-subscription.mjs
//
// Safe to re-run: only updates documents missing `subscription`.

import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const now = new Date().toISOString();

    const result = await db.collection("users").updateMany(
      { subscription: { $exists: false } },
      { $set: { subscription: "free", updatedAt: now } },
    );

    console.log(
      `Updated ${result.modifiedCount} user(s) with subscription: "free"`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
