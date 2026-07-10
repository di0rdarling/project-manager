import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Tool, ToolResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; toolId: string }>;
};

type StoredTool = Omit<Tool, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Tool["_id"];
  projectId: Tool["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeTool(tool: StoredTool): ToolResponse {
  return {
    _id: tool._id.toString(),
    userId: tool.userId.toString(),
    projectId: tool.projectId.toString(),
    name: typeof tool.name === "string" ? tool.name : "",
    content: tool.content,
    createdAt: toIsoString(tool.createdAt),
    updatedAt: tool.updatedAt
      ? toIsoString(tool.updatedAt)
      : toIsoString(tool.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, toolId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(toolId)) {
      return Response.json({ error: "Invalid tool id" }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!name) {
      return Response.json({ error: "Tool name is required" }, { status: 400 });
    }

    if (isRichTextEmpty(content)) {
      return Response.json({ error: "Tool content is required" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredTool>("tools")
      .findOneAndUpdate(
        {
          _id: new ObjectId(toolId),
          projectId: new ObjectId(id),
          userId: auth.userId,
        },
        {
          $set: {
            name,
            content,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Tool not found" }, { status: 404 });
    }

    return Response.json(serializeTool(result));
  } catch {
    return Response.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, toolId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(toolId)) {
      return Response.json({ error: "Invalid tool id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("tools")
      .deleteOne({
        _id: new ObjectId(toolId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Tool not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
