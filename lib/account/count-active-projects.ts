import type { Db, ObjectId } from "mongodb";
import type { StoredProject } from "@/lib/serialize/serialize-project";

export function countActiveProjectsForUser(
  db: Db,
  userId: ObjectId,
): Promise<number> {
  return db.collection<StoredProject>("projects").countDocuments({ userId });
}
