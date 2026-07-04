import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import type { Project, ProjectResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StoredProject = Omit<Project, "_id" | "createdAt" | "updatedAt"> & {
  _id: Project["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeProject(project: StoredProject): ProjectResponse {
  return {
    _id: project._id.toString(),
    name: project.name,
    description: project.description,
    createdAt: toIsoString(project.createdAt),
    updatedAt: project.updatedAt
      ? toIsoString(project.updatedAt)
      : toIsoString(project.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
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
    const result = await client
      .db()
      .collection<StoredProject>("projects")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
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

    return Response.json(serializeProject(result));
  } catch {
    return Response.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("projects")
      .deleteOne({ _id: new ObjectId(id) });

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
