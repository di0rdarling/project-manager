import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { findUserById, serializeUser } from "@/lib/users";

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const user = await findUserById(client.db(), auth.userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(serializeUser(user));
  } catch {
    return Response.json(
      { error: "Failed to fetch current user" },
      { status: 500 },
    );
  }
}
