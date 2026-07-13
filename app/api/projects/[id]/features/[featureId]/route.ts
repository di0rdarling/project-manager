import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import {
  parseRequirementIds,
  validateRequirementLinks,
} from "@/lib/feature-requirements";
import getClientPromise from "@/lib/mongodb";
import { isRichTextEmpty } from "@/lib/rich-text";
import { serializeFeature, type StoredFeature } from "@/lib/serialize/serialize-feature";

type RouteContext = {
  params: Promise<{ id: string; featureId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

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
        userId: auth.userId,
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

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

    const client = await getClientPromise();
    const projectId = new ObjectId(id);
    const requirementError = await validateRequirementLinks(
      client,
      auth.userId,
      projectId,
      requirementResult.requirementIds,
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
          userId: auth.userId,
        },
        {
          $set: {
            title,
            content,
            requirementIds: requirementResult.requirementIds,
            updatedAt: new Date().toISOString(),
          },
          $unset: {
            requirementId: "",
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

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
        userId: auth.userId,
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
