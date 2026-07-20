import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { getDescendantFolderIds } from "@/lib/note-folders";
import type { NoteFolder, NoteFolderResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; folderId: string }>;
};

type StoredNoteFolder = Omit<
  NoteFolder,
  "_id" | "projectId" | "createdAt" | "updatedAt"
> & {
  _id: NoteFolder["_id"];
  projectId: NoteFolder["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeNoteFolder(folder: StoredNoteFolder): NoteFolderResponse {
  return {
    _id: folder._id.toString(),
    userId: folder.userId.toString(),
    projectId: folder.projectId.toString(),
    parentFolderId: folder.parentFolderId
      ? folder.parentFolderId.toString()
      : null,
    name: typeof folder.name === "string" ? folder.name : "",
    createdAt: toIsoString(folder.createdAt),
    updatedAt: folder.updatedAt
      ? toIsoString(folder.updatedAt)
      : toIsoString(folder.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, folderId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(folderId)) {
      return Response.json({ error: "Invalid folder id" }, { status: 400 });
    }

    const body = await request.json();
    const hasName = Object.hasOwn(body, "name");
    const hasParentFolderId = Object.hasOwn(body, "parentFolderId");

    if (!hasName && !hasParentFolderId) {
      return Response.json(
        { error: "No folder fields provided to update" },
        { status: 400 },
      );
    }

    const updates: {
      name?: string;
      parentFolderId?: ObjectId | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (hasName) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return Response.json({ error: "Folder name is required" }, { status: 400 });
      }
      updates.name = name;
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const folderObjectId = new ObjectId(folderId);

    const existingFolder = await db.collection<StoredNoteFolder>("noteFolders").findOne({
      _id: folderObjectId,
      projectId: projectObjectId,
      userId: auth.userId,
    });

    if (!existingFolder) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    if (hasParentFolderId) {
      const parentFolderId =
        body.parentFolderId === null
          ? null
          : typeof body.parentFolderId === "string" && body.parentFolderId.trim()
            ? body.parentFolderId.trim()
            : undefined;

      if (parentFolderId === undefined) {
        return Response.json(
          { error: "Invalid parent folder id" },
          { status: 400 },
        );
      }

      if (parentFolderId === folderId) {
        return Response.json(
          { error: "A folder cannot be its own parent" },
          { status: 400 },
        );
      }

      if (parentFolderId) {
        if (!ObjectId.isValid(parentFolderId)) {
          return Response.json(
            { error: "Invalid parent folder id" },
            { status: 400 },
          );
        }

        const parentFolder = await db
          .collection<StoredNoteFolder>("noteFolders")
          .findOne({
            _id: new ObjectId(parentFolderId),
            projectId: projectObjectId,
            userId: auth.userId,
          });

        if (!parentFolder) {
          return Response.json({ error: "Parent folder not found" }, { status: 404 });
        }

        const allFolders = await db
          .collection<StoredNoteFolder>("noteFolders")
          .find({
            projectId: projectObjectId,
            userId: auth.userId,
          })
          .toArray();

        const descendants = getDescendantFolderIds(
          allFolders.map((folder) => ({
            _id: folder._id.toString(),
            parentFolderId: folder.parentFolderId
              ? folder.parentFolderId.toString()
              : null,
            name: typeof folder.name === "string" ? folder.name : "",
          })),
          folderId,
        );

        if (descendants.has(parentFolderId)) {
          return Response.json(
            { error: "A folder cannot be moved into one of its descendants" },
            { status: 400 },
          );
        }
      }

      updates.parentFolderId = parentFolderId
        ? new ObjectId(parentFolderId)
        : null;
    }

    const result = await db.collection<StoredNoteFolder>("noteFolders").findOneAndUpdate(
      {
        _id: folderObjectId,
        projectId: projectObjectId,
        userId: auth.userId,
      },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    return Response.json(serializeNoteFolder(result));
  } catch {
    return Response.json({ error: "Failed to update note folder" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, folderId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(folderId)) {
      return Response.json({ error: "Invalid folder id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const folderObjectId = new ObjectId(folderId);

    const folder = await db.collection<StoredNoteFolder>("noteFolders").findOne({
      _id: folderObjectId,
      projectId: projectObjectId,
      userId: auth.userId,
    });

    if (!folder) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    const reassignedParentId = folder.parentFolderId ?? null;

    await db.collection("noteFolders").updateMany(
      {
        parentFolderId: folderObjectId,
        projectId: projectObjectId,
        userId: auth.userId,
      },
      {
        $set: {
          parentFolderId: reassignedParentId,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    await db.collection("notes").updateMany(
      {
        folderId: folderObjectId,
        projectId: projectObjectId,
        userId: auth.userId,
      },
      {
        $set: {
          folderId: reassignedParentId,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    const deleteResult = await db.collection("noteFolders").deleteOne({
      _id: folderObjectId,
      projectId: projectObjectId,
      userId: auth.userId,
    });

    if (deleteResult.deletedCount === 0) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete note folder" }, { status: 500 });
  }
}
