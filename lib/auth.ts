import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

export const AUTH_COOKIE_NAME = "pm-auth";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_ROUNDS = 12;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export function verifyPasswordHash(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function signPayload(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

/**
 * Session token format: `${userId}.${expires}.${signature}`, where the
 * signature is an HMAC over `${userId}.${expires}` keyed by AUTH_SECRET.
 */
export function createSessionToken(userId: string): string {
  const expires = String(Date.now() + SESSION_DURATION_MS);
  const payload = `${userId}.${expires}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
): { userId: string } | null {
  if (!token) {
    return null;
  }

  const [userId, expires, signature] = token.split(".");
  if (!userId || !expires || !signature) {
    return null;
  }

  const expiryTime = Number(expires);
  if (!Number.isFinite(expiryTime) || Date.now() > expiryTime) {
    return null;
  }

  let expectedSignature: string;
  try {
    expectedSignature = signPayload(`${userId}.${expires}`);
  } catch {
    return null;
  }

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return { userId };
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
}
