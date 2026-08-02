import { requireUserId } from "@/lib/current-user";
import { getChatProviderConfigError } from "@/lib/chat-generation";
import {
  getDashboardDigest,
  serializeDashboardDigest,
  upsertDashboardDigest,
} from "@/lib/dashboard/dashboard-digest-store";
import { generateJordanDashboardDigest } from "@/lib/dashboard/generate-jordan-digest";
import getClientPromise from "@/lib/mongodb";
import {
  findUserById,
  getUserDashboardDigestModelId,
} from "@/lib/users";

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const stored = await getDashboardDigest(db, auth.userId);

    if (!stored) {
      return Response.json({ error: "Dashboard digest not found" }, { status: 404 });
    }

    return Response.json(serializeDashboardDigest(stored));
  } catch {
    return Response.json(
      { error: "Failed to fetch dashboard digest" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const userId = auth.userId;

    const user = await findUserById(db, userId);
    const userName = user?.name ?? null;
    const dashboardDigestModelId = getUserDashboardDigestModelId(user);
    const providerConfigError = getChatProviderConfigError(
      dashboardDigestModelId,
    );

    if (providerConfigError) {
      return Response.json(
        { error: "AI digest generation is not configured" },
        { status: 503 },
      );
    }

    const digest = await generateJordanDashboardDigest(
      db,
      userId,
      userName,
      dashboardDigestModelId,
    );

    const stored = await upsertDashboardDigest(db, userId, {
      digest: digest.digest,
      suggestedAction: digest.suggestedAction,
      modelId: dashboardDigestModelId,
    });

    return Response.json(serializeDashboardDigest(stored));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI digest generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate dashboard digest" },
      { status: 500 },
    );
  }
}
