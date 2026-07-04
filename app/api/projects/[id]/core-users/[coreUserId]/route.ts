import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { CoreUser, CoreUserResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; coreUserId: string }>;
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, coreUserId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(coreUserId)) {
      return Response.json({ error: "Invalid core user id" }, { status: 400 });
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

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredCoreUser>("coreUsers")
      .findOneAndUpdate(
        {
          _id: new ObjectId(coreUserId),
          projectId: new ObjectId(id),
        },
        {
          $set: {
            name,
            role,
            content,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      return Response.json({ error: "Core user not found" }, { status: 404 });
    }

    return Response.json(serializeCoreUser(result));
  } catch {
    return Response.json(
      { error: "Failed to update core user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, coreUserId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(coreUserId)) {
      return Response.json({ error: "Invalid core user id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("coreUsers")
      .deleteOne({
        _id: new ObjectId(coreUserId),
        projectId: new ObjectId(id),
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Core user not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete core user" },
      { status: 500 },
    );
  }
}
