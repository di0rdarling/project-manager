import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import { parseRequirementPriority } from "@/lib/requirements";
import type { Requirement, RequirementResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; requirementId: string }>;
};

type StoredRequirement = Omit<
  Requirement,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: Requirement["_id"];
  projectId: Requirement["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeRequirement(
  requirement: StoredRequirement,
): RequirementResponse {
  return {
    _id: requirement._id.toString(),
    userId: requirement.userId.toString(),
    projectId: requirement.projectId.toString(),
    title: typeof requirement.title === "string" ? requirement.title : "",
    content: requirement.content,
    priority: parseRequirementPriority(requirement.priority),
    createdAt: toIsoString(requirement.createdAt),
    updatedAt: requirement.updatedAt
      ? toIsoString(requirement.updatedAt)
      : toIsoString(requirement.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, requirementId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(requirementId)) {
      return Response.json(
        { error: "Invalid requirement id" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const priority = parseRequirementPriority(body.priority);

    if (!title) {
      return Response.json(
        { error: "Requirement title is required" },
        { status: 400 },
      );
    }

    if (isRichTextEmpty(content)) {
      return Response.json(
        { error: "Requirement content is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredRequirement>("requirements")
      .findOneAndUpdate(
        {
          _id: new ObjectId(requirementId),
          projectId: new ObjectId(id),
          userId: auth.userId,
        },
        {
          $set: {
            title,
            content,
            priority,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Requirement not found" }, { status: 404 });
    }

    return Response.json(serializeRequirement(result));
  } catch {
    return Response.json(
      { error: "Failed to update requirement" },
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

    const { id, requirementId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(requirementId)) {
      return Response.json(
        { error: "Invalid requirement id" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("requirements")
      .deleteOne({
        _id: new ObjectId(requirementId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Requirement not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete requirement" },
      { status: 500 },
    );
  }
}
