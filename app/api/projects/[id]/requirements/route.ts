import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import { parseRequirementPriority } from "@/lib/requirements";
import type { Requirement, RequirementResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
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

async function getProjectOr404(projectId: string, userId: ObjectId) {
  if (!ObjectId.isValid(projectId)) {
    return {
      error: Response.json({ error: "Invalid project id" }, { status: 400 }),
    };
  }

  const client = await getClientPromise();
  const project = await client
    .db()
    .collection("projects")
    .findOne({ _id: new ObjectId(projectId), userId });

  if (!project) {
    return {
      error: Response.json({ error: "Project not found" }, { status: 404 }),
    };
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

    const requirements = await result.client
      .db()
      .collection<StoredRequirement>("requirements")
      .find({ projectId: new ObjectId(id), userId: auth.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(requirements.map(serializeRequirement));
  } catch {
    return Response.json(
      { error: "Failed to fetch requirements" },
      { status: 500 },
    );
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

    const now = new Date().toISOString();
    const requirement: Omit<Requirement, "_id"> = {
      userId: auth.userId,
      projectId: new ObjectId(id),
      title,
      content,
      priority,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<Requirement, "_id">>("requirements")
      .insertOne(requirement);

    return Response.json(
      serializeRequirement({ ...requirement, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create requirement" },
      { status: 500 },
    );
  }
}
