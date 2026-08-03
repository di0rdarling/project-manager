import { requireUserId } from "@/lib/current-user";
import { isChatModelId, type ChatModelId } from "@/lib/chats/chat-models";
import getClientPromise from "@/lib/mongodb";
import type { UserSubscription } from "@/lib/types";
import {
  findUserById,
  normalizeUserSubscription,
  serializeUser,
  updateUserFields,
} from "@/lib/users";

const MAX_NAME_LENGTH = 100;

type PatchBody = {
  name?: unknown;
  agentTaskGenerationModelId?: unknown;
  dashboardDigestModelId?: unknown;
  subscription?: unknown;
};

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

    const body = (await request.json()) as PatchBody;
    const hasName = "name" in body;
    const hasAgentTaskGenerationModelId = "agentTaskGenerationModelId" in body;
    const hasDashboardDigestModelId = "dashboardDigestModelId" in body;
    const hasSubscription = "subscription" in body;

    if (
      !hasName &&
      !hasAgentTaskGenerationModelId &&
      !hasDashboardDigestModelId &&
      !hasSubscription
    ) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();

    const updates: {
      name?: string | null;
      agentTaskGenerationModelId?: ChatModelId | null;
      dashboardDigestModelId?: ChatModelId | null;
      subscription?: UserSubscription;
    } = {};

    if (hasName) {
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

      updates.name = trimmedName || null;
    }

    if (hasAgentTaskGenerationModelId) {
      const modelId = body.agentTaskGenerationModelId;

      if (modelId !== null && !isChatModelId(modelId)) {
        return Response.json(
          { error: "agentTaskGenerationModelId must be a valid model id" },
          { status: 400 },
        );
      }

      updates.agentTaskGenerationModelId = modelId;
    }

    if (hasDashboardDigestModelId) {
      const modelId = body.dashboardDigestModelId;

      if (modelId !== null && !isChatModelId(modelId)) {
        return Response.json(
          { error: "dashboardDigestModelId must be a valid model id" },
          { status: 400 },
        );
      }

      updates.dashboardDigestModelId = modelId;
    }

    if (hasSubscription) {
      if (body.subscription !== "premium" && body.subscription !== "free") {
        return Response.json(
          { error: "subscription must be either free or premium" },
          { status: 400 },
        );
      }

      const existingUser = await findUserById(db, auth.userId);
      if (!existingUser) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      const currentSubscription = normalizeUserSubscription(
        existingUser.subscription,
      );

      if (body.subscription === currentSubscription) {
        return Response.json(serializeUser(existingUser));
      }

      if (body.subscription === "premium" && currentSubscription !== "free") {
        return Response.json(
          { error: "Only free accounts can upgrade to premium" },
          { status: 400 },
        );
      }

      if (body.subscription === "free" && currentSubscription !== "premium") {
        return Response.json(
          { error: "Only premium accounts can cancel their subscription" },
          { status: 400 },
        );
      }

      updates.subscription = body.subscription;
    }

    const user = await updateUserFields(db, auth.userId, updates);

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
