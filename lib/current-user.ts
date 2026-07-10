import { headers } from "next/headers";
import { ObjectId } from "mongodb";

/**
 * `proxy.ts` verifies the session cookie for every matched request and, only
 * on success, sets this trusted header (after stripping any client-supplied
 * value). Route handlers can therefore read it directly instead of
 * re-verifying the cookie on every request.
 */
export const CURRENT_USER_ID_HEADER = "x-user-id";

export async function requireUserId(): Promise<
  { userId: ObjectId } | { error: Response }
> {
  const headerList = await headers();
  const rawUserId = headerList.get(CURRENT_USER_ID_HEADER);

  if (!rawUserId || !ObjectId.isValid(rawUserId)) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: new ObjectId(rawUserId) };
}
