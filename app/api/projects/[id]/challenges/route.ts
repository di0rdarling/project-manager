import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import {
  featureChallengesFilter,
  parseChallengeStatus,
  projectLevelChallengesFilter,
} from "@/lib/challenges";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Challenge, ChallengeResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
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

async function getProjectOr404(projectId: string, userId: ObjectId) {
  if (!ObjectId.isValid(projectId)) {
    return {
      error: Response.json({ error: "Invalid project id" }, { status: 400 }),
    };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId), userId });

  if (!project) {
    return {
      error: Response.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  return { client };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await context.params;
    const result = await getProjectOr404(id, auth.userId);

    if ("error" in result) {
      return result.error;
    }

    const featureId = new URL(request.url).searchParams.get("featureId");
    const projectObjectId = new ObjectId(id);

    if (featureId) {
      if (!ObjectId.isValid(featureId)) {
        return Response.json({ error: "Invalid feature id" }, { status: 400 });
      }

      const feature = await result.client
        .db()
        .collection("features")
        .findOne({
          _id: new ObjectId(featureId),
          projectId: projectObjectId,
          userId: auth.userId,
        });

      if (!feature) {
        return Response.json({ error: "Feature not found" }, { status: 404 });
      }
    }

    const challenges = await result.client
      .db()
      .collection<StoredChallenge>("challenges")
      .find({
        ...(featureId
          ? featureChallengesFilter(projectObjectId, new ObjectId(featureId))
          : projectLevelChallengesFilter(projectObjectId)),
        userId: auth.userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(challenges.map(serializeChallenge));
  } catch {
    return Response.json(
      { error: "Failed to fetch challenges" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await context.params;
    const result = await getProjectOr404(id, auth.userId);

    if ("error" in result) {
      return result.error;
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const overview =
      typeof body.overview === "string" ? body.overview.trim() : "";
    const status = parseChallengeStatus(body.status);
    const featureId =
      typeof body.featureId === "string" && body.featureId.trim()
        ? body.featureId.trim()
        : null;

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

    const projectObjectId = new ObjectId(id);

    if (featureId) {
      if (!ObjectId.isValid(featureId)) {
        return Response.json({ error: "Invalid feature id" }, { status: 400 });
      }

      const feature = await result.client
        .db()
        .collection("features")
        .findOne({
          _id: new ObjectId(featureId),
          projectId: projectObjectId,
          userId: auth.userId,
        });

      if (!feature) {
        return Response.json({ error: "Feature not found" }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const challenge: Omit<Challenge, "_id"> = {
      userId: auth.userId,
      projectId: projectObjectId,
      featureId: featureId ? new ObjectId(featureId) : null,
      title,
      overview,
      status,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<Challenge, "_id">>("challenges")
      .insertOne(challenge);

    return Response.json(
      serializeChallenge({ ...challenge, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create challenge" },
      { status: 500 },
    );
  }
}
