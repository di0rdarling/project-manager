import { requireUserId } from "@/lib/current-user";
import { countMainChatUserMessagesThisMonth } from "@/lib/account/count-ai-chat-messages";
import { countActiveProjectsForUser } from "@/lib/account/count-active-projects";
import getClientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();

    const [activeProjects, aiChatMessages] = await Promise.all([
      countActiveProjectsForUser(db, auth.userId),
      countMainChatUserMessagesThisMonth(db, auth.userId),
    ]);

    return Response.json({ activeProjects, aiChatMessages });
  } catch {
    return Response.json(
      { error: "Failed to fetch account usage" },
      { status: 500 },
    );
  }
}
