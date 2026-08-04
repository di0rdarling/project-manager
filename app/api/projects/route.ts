import { countActiveProjectsForUser } from "@/lib/account/count-active-projects";
import { hasReachedActiveProjectLimit } from "@/lib/account/subscription-limits";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { findUserById, normalizeUserSubscription } from "@/lib/users";
import {
  serializeProject,
  type StoredProject,
} from "@/lib/serialize/serialize-project";
import type { Project } from "@/lib/types";

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const projects = await client
      .db()
      .collection<StoredProject>("projects")
      .find({ userId: auth.userId })
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
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
    const user = await findUserById(db, auth.userId);
    const subscription = normalizeUserSubscription(user?.subscription);
    const activeProjects = await countActiveProjectsForUser(db, auth.userId);

    if (hasReachedActiveProjectLimit(subscription, activeProjects)) {
      return Response.json(
        {
          error:
            "Active project limit reached. Upgrade to Premium to create more projects.",
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();
    const project: Omit<Project, "_id"> = {
      userId: auth.userId,
      name,
      description,
      aiSummary: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
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
