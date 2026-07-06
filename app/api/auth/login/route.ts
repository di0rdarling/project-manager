import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  isPasswordProtectionEnabled,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isPasswordProtectionEnabled()) {
    return Response.json(
      { error: "Password protection is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";

    if (!password) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    if (!verifyPassword(password)) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, createAuthToken(), getAuthCookieOptions());

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
