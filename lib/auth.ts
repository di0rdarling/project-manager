import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "pm-auth";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function isPasswordProtectionEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD?.length);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return false;
  }

  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

function signExpiry(expires: string): string {
  return createHmac("sha256", getAuthSecret()).update(expires).digest("hex");
}

export function createAuthToken(): string {
  const expires = String(Date.now() + SESSION_DURATION_MS);
  const signature = signExpiry(expires);
  return `${expires}.${signature}`;
}

export function verifyAuthToken(token: string | undefined): boolean {
  if (!token || !isPasswordProtectionEnabled()) {
    return !isPasswordProtectionEnabled();
  }

  const [expires, signature] = token.split(".");
  if (!expires || !signature) {
    return false;
  }

  const expiryTime = Number(expires);
  if (!Number.isFinite(expiryTime) || Date.now() > expiryTime) {
    return false;
  }

  let expectedSignature: string;
  try {
    expectedSignature = signExpiry(expires);
  } catch {
    return false;
  }

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
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
