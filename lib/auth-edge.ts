export const AUTH_COOKIE_NAME = "pm-auth";

function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET;
}

async function signExpiry(expires: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(expires),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

export async function verifyAuthToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = getAuthSecret();
  if (!process.env.APP_PASSWORD || !secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const [expires, signature] = token.split(".");
  if (!expires || !signature) {
    return false;
  }

  const expiryTime = Number(expires);
  if (!Number.isFinite(expiryTime) || Date.now() > expiryTime) {
    return false;
  }

  const expectedSignature = await signExpiry(expires, secret);
  return timingSafeEqualHex(signature, expectedSignature);
}
