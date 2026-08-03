import { requireUserId } from "@/lib/current-user";
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

    const activeProjects = await countActiveProjectsForUser(db, auth.userId);

    return Response.json({ activeProjects });
  } catch {
    return Response.json(
      { error: "Failed to fetch account usage" },
      { status: 500 },
    );
  }
}
