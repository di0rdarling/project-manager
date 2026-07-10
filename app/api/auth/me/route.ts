import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { findUserById, serializeUser, updateUserName } from "@/lib/users";

const MAX_NAME_LENGTH = 100;

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

export async function PATCH(request: Request) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name !== "string") {
      return Response.json({ error: "Name must be a string" }, { status: 400 });
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return Response.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const user = await updateUserName(
      client.db(),
      auth.userId,
      trimmedName || null,
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(serializeUser(user));
  } catch {
    return Response.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
