import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { isRichTextEmpty } from "@/lib/rich-text";
import { serializeFeature, type StoredFeature } from "@/lib/serialize-feature";
import type { Feature } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; featureId: string }>;
};

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
    const { id, featureId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const feature = await client
      .db()
      .collection<StoredFeature>("features")
      .findOne({
        _id: new ObjectId(featureId),
        projectId: new ObjectId(id),
      });

    if (!feature) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    return Response.json(serializeFeature(feature));
  } catch {
    return Response.json({ error: "Failed to fetch feature" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, featureId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
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

    const client = await getClientPromise();
    const projectId = new ObjectId(id);
    const requirementError = await validateRequirementLink(
      client,
      projectId,
      requirementResult.requirementId,
    );

    if (requirementError) {
      return requirementError;
    }

    const result = await client
      .db()
      .collection<StoredFeature>("features")
      .findOneAndUpdate(
        {
          _id: new ObjectId(featureId),
          projectId,
        },
        {
          $set: {
            title,
            content,
            requirementId: requirementResult.requirementId,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    return Response.json(serializeFeature(result));
  } catch {
    return Response.json(
      { error: "Failed to update feature" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, featureId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("features")
      .deleteOne({
        _id: new ObjectId(featureId),
        projectId: new ObjectId(id),
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Feature not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete feature" },
      { status: 500 },
    );
  }
}
