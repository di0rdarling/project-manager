import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { parseChallengeStatus } from "@/lib/challenges";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Challenge, ChallengeResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; challengeId: string }>;
};

type StoredChallenge = Omit<
  Challenge,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Challenge["_id"];
  projectId: Challenge["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeChallenge(challenge: StoredChallenge): ChallengeResponse {
  const status = parseChallengeStatus(challenge.status) ?? "open";

  return {
    _id: challenge._id.toString(),
    userId: challenge.userId.toString(),
    projectId: challenge.projectId.toString(),
    featureId: challenge.featureId ? challenge.featureId.toString() : null,
    title: typeof challenge.title === "string" ? challenge.title : "",
    overview: challenge.overview,
    status,
    createdAt: toIsoString(challenge.createdAt),
    updatedAt: challenge.updatedAt
      ? toIsoString(challenge.updatedAt)
      : toIsoString(challenge.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, challengeId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(challengeId)) {
      return Response.json({ error: "Invalid challenge id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const overview =
      typeof body.overview === "string" ? body.overview.trim() : "";
    const status = parseChallengeStatus(body.status);

    if (!title) {
      return Response.json(
        { error: "Challenge title is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(overview)) {
      return Response.json(
        { error: "Challenge overview is required" },
        { status: 400 },
      );
    }

    if (!status) {
      return Response.json(
        { error: "Challenge status is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredChallenge>("challenges")
      .findOneAndUpdate(
        {
          _id: new ObjectId(challengeId),
          projectId: new ObjectId(id),
          userId: auth.userId,
        },
        {
          $set: {
            title,
            overview,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }

    return Response.json(serializeChallenge(result));
  } catch {
    return Response.json(
      { error: "Failed to update challenge" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, challengeId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(challengeId)) {
      return Response.json({ error: "Invalid challenge id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("challenges")
      .deleteOne({
        _id: new ObjectId(challengeId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete challenge" },
      { status: 500 },
    );
  }
}
