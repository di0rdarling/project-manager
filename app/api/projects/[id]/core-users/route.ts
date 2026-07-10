import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { CoreUser, CoreUserResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StoredCoreUser = Omit<
  CoreUser,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: CoreUser["_id"];
  projectId: CoreUser["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeCoreUser(coreUser: StoredCoreUser): CoreUserResponse {
  return {
    _id: coreUser._id.toString(),
    userId: coreUser.userId.toString(),
    projectId: coreUser.projectId.toString(),
    name: typeof coreUser.name === "string" ? coreUser.name : "",
    role: typeof coreUser.role === "string" ? coreUser.role : "",
    content: coreUser.content,
    createdAt: toIsoString(coreUser.createdAt),
    updatedAt: coreUser.updatedAt
      ? toIsoString(coreUser.updatedAt)
      : toIsoString(coreUser.createdAt),
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

    const coreUsers = await result.client
      .db()
      .collection<StoredCoreUser>("coreUsers")
      .find({ projectId: new ObjectId(id), userId: auth.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(coreUsers.map(serializeCoreUser));
  } catch {
    return Response.json(
      { error: "Failed to fetch core users" },
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (isRichTextEmpty(content)) {
      return Response.json(
        { error: "User description is required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const coreUser: Omit<CoreUser, "_id"> = {
      userId: auth.userId,
      projectId: new ObjectId(id),
      name,
      role,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await result.client
      .db()
      .collection<Omit<CoreUser, "_id">>("coreUsers")
      .insertOne(coreUser);

    return Response.json(
      serializeCoreUser({ ...coreUser, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to create core user" },
      { status: 500 },
    );
  }
}
