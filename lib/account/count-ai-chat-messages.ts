import type { Db, ObjectId } from "mongodb";
import { getStartOfCurrentMonthUtc } from "@/lib/dates";
import type { StoredChatMessage } from "@/lib/serialize/serialize-chat";

const MAIN_CHAT_MESSAGES_COLLECTION = "chat_messages";

/**
 * Counts user-sent messages in main project chats (`/chats/[id]`).
 * Agent task overview and document review chats use separate collections.
 */
export function countMainChatUserMessagesThisMonth(
  db: Db,
  userId: ObjectId,
  referenceDate: Date = new Date(),
): Promise<number> {
  const monthStartIso = getStartOfCurrentMonthUtc(referenceDate).toISOString();

  return db.collection<StoredChatMessage>(MAIN_CHAT_MESSAGES_COLLECTION).countDocuments({
    userId,
    role: "user",
    createdAt: { $gte: monthStartIso },
  });
}
