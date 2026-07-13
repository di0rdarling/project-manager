import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import {
  parseRequirementIds,
  validateRequirementLinks,
} from "@/lib/feature-requirements";
import getClientPromise from "@/lib/mongodb";
import { isRichTextEmpty } from "@/lib/rich-text";
import { serializeFeature, type StoredFeature } from "@/lib/serialize/serialize-feature";
import type { Feature } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  return { client, projectId: new ObjectId(projectId) };
}

export async function GET(_request: Request, context: RouteContext) {
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

    const features = await result.client
      .db()
      .collection<StoredFeature>("features")
      .find({ projectId: result.projectId, userId: auth.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(features.map(serializeFeature));
  } catch {
    return Response.json(
      { error: "Failed to fetch features" },
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
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const requirementResult = parseRequirementIds(body.requirementIds);

    if ("error" in requirementResult) {
      return requirementResult.error;
    }

    if (!title) {
      return Response.json(
        { error: "Feature title is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(content)) {
      return Response.json(
        { error: "Feature description is required" },
        { status: 400 },
      );
    }

    const requirementError = await validateRequirementLinks(
      result.client,
      auth.userId,
      result.projectId,
      requirementResult.requirementIds,
    );

    if (requirementError) {
      return requirementError;
    }

    const now = new Date().toISOString();
    const feature: Omit<Feature, "_id"> = {
      userId: auth.userId,
      projectId: result.projectId,
      title,
      content,
      requirementIds: requirementResult.requirementIds,
      aiSummary: null,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<Feature, "_id">>("features")
      .insertOne(feature);

    return Response.json(
      serializeFeature({ ...feature, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create feature" },
      { status: 500 },
    );
  }
}
