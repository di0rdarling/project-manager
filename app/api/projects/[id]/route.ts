import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { getLatestChatActivityByProjectId } from "@/lib/projects/get-latest-chat-activity-by-project";
import {
  serializeProject,
  type StoredProject,
} from "@/lib/serialize/serialize-project";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const project = await db
      .collection<StoredProject>("projects")
      .findOne({ _id: projectObjectId, userId: auth.userId });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const chatActivityByProjectId = await getLatestChatActivityByProjectId(
      db,
      auth.userId,
      [projectObjectId],
    );

    return Response.json(
      serializeProject(project, {
        lastChatActivityAt: chatActivityByProjectId.get(id),
      }),
    );
  } catch {
    return Response.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!name) {
      return Response.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const result = await db
      .collection<StoredProject>("projects")
      .findOneAndUpdate(
        { _id: projectObjectId, userId: auth.userId },
        {
          $set: {
            name,
            description,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const chatActivityByProjectId = await getLatestChatActivityByProjectId(
      db,
      auth.userId,
      [projectObjectId],
    );

    return Response.json(
      serializeProject(result, {
        lastChatActivityAt: chatActivityByProjectId.get(id),
      }),
    );
  } catch {
    return Response.json(
      { error: "Failed to update project" },
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

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("projects")
      .deleteOne({ _id: new ObjectId(id), userId: auth.userId });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
