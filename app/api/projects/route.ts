import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import type { Project, ProjectResponse } from "@/lib/types";

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

export async function GET() {
  try {
    const client = await getClientPromise();
    const projects = await client
      .db()
      .collection<StoredProject>("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(projects.map(serializeProject));
  } catch {
    return Response.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const now = new Date().toISOString();
    const project: Omit<Project, "_id"> = {
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<Omit<Project, "_id">>("projects")
      .insertOne(project);

    return Response.json(
      serializeProject({ ...project, _id: result.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
