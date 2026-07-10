// One-time (idempotent) migration: converts legacy feature.requirementId
// (single link) to feature.requirementIds (array).
//
// Usage:
//   node --env-file=.env scripts/migrate-feature-requirement-ids.mjs
//
// Safe to re-run: only updates features that still have requirementId set.

import { MongoClient } from "mongodb";

async function migrateFeatureRequirementIds() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const features = db.collection("features");

    const legacyFeatures = await features
      .find({
        requirementId: { $exists: true, $ne: null },
      })
      .toArray();

    if (legacyFeatures.length === 0) {
      console.log("No legacy feature requirement links to migrate.");
      return;
    }

    let migratedCount = 0;

    for (const feature of legacyFeatures) {
      const existingIds = Array.isArray(feature.requirementIds)
        ? feature.requirementIds
        : [];
      const legacyId = feature.requirementId;
      const alreadyPresent = existingIds.some(
        (id) => id.toString() === legacyId.toString(),
      );
      const requirementIds = alreadyPresent
        ? existingIds
        : [...existingIds, legacyId];

      const result = await features.updateOne(
        { _id: feature._id },
        {
          $set: {
            requirementIds,
            updatedAt: new Date().toISOString(),
          },
          $unset: {
            requirementId: "",
          },
        },
      );

      if (result.modifiedCount > 0) {
        migratedCount += 1;
      }
    }

    console.log(
      `Migrated ${migratedCount} feature(s) from requirementId to requirementIds.`,
    );
  } finally {
    await client.close();
  }
}

migrateFeatureRequirementIds().catch((error) => {
  console.error(error);
  process.exit(1);
});
