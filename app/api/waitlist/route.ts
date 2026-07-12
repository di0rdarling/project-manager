import getClientPromise from "@/lib/mongodb";
import {
  createWaitlistEntry,
  ensureWaitlistIndexes,
  findWaitlistEntryByEmail,
} from "@/lib/waitlist";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    await ensureWaitlistIndexes(db);

    const existing = await findWaitlistEntryByEmail(db, email);
    if (existing) {
      return Response.json(
        { error: "This email is already on the waitlist" },
        { status: 409 },
      );
    }

    await createWaitlistEntry(db, email);

    return Response.json({ success: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Failed to join the waitlist" },
      { status: 500 },
    );
  }
}
