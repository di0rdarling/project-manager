import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { PainPoint, PainPointResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; painPointId: string }>;
};

type StoredPainPoint = Omit<
  PainPoint,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: PainPoint["_id"];
  projectId: PainPoint["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializePainPoint(painPoint: StoredPainPoint): PainPointResponse {
  return {
    _id: painPoint._id.toString(),
    userId: painPoint.userId.toString(),
    projectId: painPoint.projectId.toString(),
    title: typeof painPoint.title === "string" ? painPoint.title : "",
    content: painPoint.content,
    createdAt: toIsoString(painPoint.createdAt),
    updatedAt: painPoint.updatedAt
      ? toIsoString(painPoint.updatedAt)
      : toIsoString(painPoint.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, painPointId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(painPointId)) {
      return Response.json({ error: "Invalid pain point id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!title) {
      return Response.json(
        { error: "Pain point title is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(content)) {
      return Response.json(
        { error: "Pain point content is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredPainPoint>("painPoints")
      .findOneAndUpdate(
        {
          _id: new ObjectId(painPointId),
          projectId: new ObjectId(id),
          userId: auth.userId,
        },
        {
          $set: {
            title,
            content,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Pain point not found" }, { status: 404 });
    }

    return Response.json(serializePainPoint(result));
  } catch {
    return Response.json(
      { error: "Failed to update pain point" },
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

    const { id, painPointId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(painPointId)) {
      return Response.json({ error: "Invalid pain point id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("painPoints")
      .deleteOne({
        _id: new ObjectId(painPointId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Pain point not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete pain point" },
      { status: 500 },
    );
  }
}
