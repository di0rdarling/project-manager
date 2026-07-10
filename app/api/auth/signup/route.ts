import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getAuthCookieOptions,
  hashPassword,
} from "@/lib/auth";
import getClientPromise from "@/lib/mongodb";
import {
  createUser,
  ensureUserIndexes,
  findUserByEmail,
  normalizeEmail,
  serializeUser,
} from "@/lib/users";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return Response.json(
        {
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    await ensureUserIndexes(db);

    const existing = await findUserByEmail(db, email);
    if (existing) {
      return Response.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(db, {
      email: normalizeEmail(email),
      passwordHash,
      name: name || null,
    });

    const cookieStore = await cookies();
    cookieStore.set(
      AUTH_COOKIE_NAME,
      createSessionToken(user._id.toString()),
      getAuthCookieOptions(),
    );

    return Response.json(serializeUser(user), { status: 201 });
  } catch {
    return Response.json({ error: "Failed to sign up" }, { status: 500 });
  }
}
