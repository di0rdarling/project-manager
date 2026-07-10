import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Tool, ToolResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
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

async function getProjectOr404(projectId: string, userId: ObjectId) {
  if (!ObjectId.isValid(projectId)) {
    return { error: Response.json({ error: "Invalid project id" }, { status: 400 }) };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId), userId });

  if (!project) {
    return { error: Response.json({ error: "Project not found" }, { status: 404 }) };
  }

  return { client };
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

    const tools = await result.client
      .db()
      .collection<StoredTool>("tools")
      .find({ projectId: new ObjectId(id), userId: auth.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(tools.map(serializeTool));
  } catch {
    return Response.json({ error: "Failed to fetch tools" }, { status: 500 });
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!name) {
      return Response.json({ error: "Tool name is required" }, { status: 400 });
    }

    if (isRichTextEmpty(content)) {
      return Response.json({ error: "Tool content is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const tool: Omit<Tool, "_id"> = {
      userId: auth.userId,
      projectId: new ObjectId(id),
      name,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<Tool, "_id">>("tools")
      .insertOne(tool);

    return Response.json(
      serializeTool({ ...tool, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create tool" }, { status: 500 });
  }
}
