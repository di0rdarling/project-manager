import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import {
  featureNoteFoldersFilter,
  noteFolderMatchesScope,
  projectLevelNoteFoldersFilter,
} from "@/lib/notes";
import type { NoteFolder, NoteFolderResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
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
    featureId: folder.featureId ? folder.featureId.toString() : null,
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

export async function GET(request: Request, context: RouteContext) {
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

    const featureId = new URL(request.url).searchParams.get("featureId");
    const projectObjectId = new ObjectId(id);

    if (featureId) {
      if (!ObjectId.isValid(featureId)) {
        return Response.json({ error: "Invalid feature id" }, { status: 400 });
      }

      const feature = await result.client
        .db()
        .collection("features")
        .findOne({
          _id: new ObjectId(featureId),
          projectId: projectObjectId,
          userId: auth.userId,
        });

      if (!feature) {
        return Response.json({ error: "Feature not found" }, { status: 404 });
      }
    }

    const folders = await result.client
      .db()
      .collection<StoredNoteFolder>("noteFolders")
      .find({
        ...(featureId
          ? featureNoteFoldersFilter(projectObjectId, new ObjectId(featureId))
          : projectLevelNoteFoldersFilter(projectObjectId)),
        userId: auth.userId,
      })
      .sort({ name: 1 })
      .toArray();

    return Response.json(folders.map(serializeNoteFolder));
  } catch {
    return Response.json({ error: "Failed to fetch note folders" }, { status: 500 });
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
    const featureId =
      typeof body.featureId === "string" && body.featureId.trim()
        ? body.featureId.trim()
        : null;
    const parentFolderId =
      typeof body.parentFolderId === "string" && body.parentFolderId.trim()
        ? body.parentFolderId.trim()
        : null;

    if (!name) {
      return Response.json({ error: "Folder name is required" }, { status: 400 });
    }

    const projectObjectId = new ObjectId(id);
    const db = result.client.db();

    if (featureId) {
      if (!ObjectId.isValid(featureId)) {
        return Response.json({ error: "Invalid feature id" }, { status: 400 });
      }

      const feature = await db.collection("features").findOne({
        _id: new ObjectId(featureId),
        projectId: projectObjectId,
        userId: auth.userId,
      });

      if (!feature) {
        return Response.json({ error: "Feature not found" }, { status: 404 });
      }
    }

    if (parentFolderId) {
      if (!ObjectId.isValid(parentFolderId)) {
        return Response.json({ error: "Invalid parent folder id" }, { status: 400 });
      }

      const parentFolder = await db.collection<StoredNoteFolder>("noteFolders").findOne({
        _id: new ObjectId(parentFolderId),
        projectId: projectObjectId,
        userId: auth.userId,
      });

      if (!parentFolder) {
        return Response.json({ error: "Parent folder not found" }, { status: 404 });
      }

      if (
        !noteFolderMatchesScope(
          parentFolder.featureId ? parentFolder.featureId.toString() : null,
          featureId,
        )
      ) {
        return Response.json(
          { error: "Parent folder does not belong to this note scope" },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();
    const folder: Omit<NoteFolder, "_id"> = {
      userId: auth.userId,
      projectId: projectObjectId,
      featureId: featureId ? new ObjectId(featureId) : null,
      parentFolderId: parentFolderId ? new ObjectId(parentFolderId) : null,
      name,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db
      .collection<Omit<NoteFolder, "_id">>("noteFolders")
      .insertOne(folder);

    return Response.json(
      serializeNoteFolder({ ...folder, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create note folder" }, { status: 500 });
  }
}
