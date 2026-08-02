import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import type { StoredProject } from "@/lib/serialize/serialize-project";
import type { StoredChat } from "@/lib/serialize/serialize-chat";

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const userId = auth.userId;

    const [totalProjects, openChats, notesThisWeek] = await Promise.all([
      db.collection<StoredProject>("projects").countDocuments({ userId }),
      db
        .collection<StoredChat>("chats")
        .countDocuments({ userId, archivedAt: null }),
      db.collection("notes").countDocuments({
        userId,
        $or: [
          { createdAt: { $gte: getStartOfWeek(new Date()) } },
          { updatedAt: { $gte: getStartOfWeek(new Date()) } },
        ],
      }),
    ]);

    return Response.json({
      totalProjects,
      openChats,
      notesThisWeek,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
