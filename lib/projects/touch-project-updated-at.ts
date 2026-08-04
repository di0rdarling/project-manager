import type { Db, ObjectId } from "mongodb";
import type { StoredProject } from "@/lib/serialize/serialize-project";

export async function touchProjectUpdatedAt(
  db: Db,
  projectId: ObjectId,
  userId: ObjectId,
  updatedAt: string = new Date().toISOString(),
): Promise<void> {
  await db.collection<StoredProject>("projects").updateOne(
    { _id: projectId, userId },
    { $set: { updatedAt } },
  );
}
