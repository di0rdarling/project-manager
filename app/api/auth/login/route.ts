import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getAuthCookieOptions,
  verifyPasswordHash,
} from "@/lib/auth";
import getClientPromise from "@/lib/mongodb";
import { findUserByEmail } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const user = await findUserByEmail(client.db(), email);

    if (!user || !(await verifyPasswordHash(password, user.passwordHash))) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(
      AUTH_COOKIE_NAME,
      createSessionToken(user._id.toString()),
      getAuthCookieOptions(),
    );

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
