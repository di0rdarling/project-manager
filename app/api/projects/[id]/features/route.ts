import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Feature, FeatureResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StoredFeature = Omit<
  Feature,
  "_id" | "projectId" | "requirementId" | "createdAt" | "updatedAt"
> & {
  _id: Feature["_id"];
  projectId: Feature["projectId"];
  requirementId: Feature["requirementId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeFeature(feature: StoredFeature): FeatureResponse {
  return {
    _id: feature._id.toString(),
    projectId: feature.projectId.toString(),
    title: typeof feature.title === "string" ? feature.title : "",
    content: feature.content,
    requirementId: feature.requirementId
      ? feature.requirementId.toString()
      : null,
    createdAt: toIsoString(feature.createdAt),
    updatedAt: feature.updatedAt
      ? toIsoString(feature.updatedAt)
      : toIsoString(feature.createdAt),
  };
}

async function getProjectOr404(projectId: string) {
  if (!ObjectId.isValid(projectId)) {
    return {
      error: Response.json({ error: "Invalid project id" }, { status: 400 }),
    };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId) });

  if (!project) {
    return {
      error: Response.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  return { client, projectId: new ObjectId(projectId) };
}

function parseRequirementId(
  value: unknown,
): { requirementId: ObjectId | null } | { error: Response } {
  if (value === null || value === undefined || value === "") {
    return { requirementId: null };
  }

  if (typeof value !== "string" || !ObjectId.isValid(value)) {
    return {
      error: Response.json(
        { error: "Invalid requirement id" },
        { status: 400 },
      ),
    };
  }

  return { requirementId: new ObjectId(value) };
}

async function validateRequirementLink(
  client: Awaited<ReturnType<typeof getClientPromise>>,
  projectId: ObjectId,
  requirementId: ObjectId | null,
): Promise<Response | null> {
  if (!requirementId) {
    return null;
  }

  const requirement = await client
    .db()
    .collection("requirements")
    .findOne({ _id: requirementId, projectId });

  if (!requirement) {
    return Response.json(
      { error: "Linked requirement not found" },
      { status: 400 },
    );
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getProjectOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const features = await result.client
      .db()
      .collection<StoredFeature>("features")
      .find({ projectId: result.projectId })
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
    const { id } = await context.params;
    const result = await getProjectOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const requirementResult = parseRequirementId(body.requirementId);

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

    const requirementError = await validateRequirementLink(
      result.client,
      result.projectId,
      requirementResult.requirementId,
    );

    if (requirementError) {
      return requirementError;
    }

    const now = new Date().toISOString();
    const feature: Omit<Feature, "_id"> = {
      projectId: result.projectId,
      title,
      content,
      requirementId: requirementResult.requirementId,
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
