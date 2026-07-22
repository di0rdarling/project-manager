import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { featureNotesFilter, noteFolderMatchesScope, projectLevelNotesFilter } from "@/lib/notes";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Note, NoteResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StoredNote = Omit<Note, "_id" | "projectId" | "createdAt" | "updatedAt"> & {
  _id: Note["_id"];
  projectId: Note["projectId"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function serializeNote(note: StoredNote): NoteResponse {
  return {
    _id: note._id.toString(),
    userId: note.userId.toString(),
    projectId: note.projectId.toString(),
    featureId: note.featureId ? note.featureId.toString() : null,
    folderId: note.folderId ? note.folderId.toString() : null,
    title: typeof note.title === "string" ? note.title : "",
    content: note.content,
    createdAt: toIsoString(note.createdAt),
    updatedAt: note.updatedAt
      ? toIsoString(note.updatedAt)
      : toIsoString(note.createdAt),
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

    const notes = await result.client
      .db()
      .collection<StoredNote>("notes")
      .find({
        ...(featureId
          ? featureNotesFilter(projectObjectId, new ObjectId(featureId))
          : projectLevelNotesFilter(projectObjectId)),
        userId: auth.userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(notes.map(serializeNote));
  } catch {
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
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
    const featureId =
      typeof body.featureId === "string" && body.featureId.trim()
        ? body.featureId.trim()
        : null;
    const folderId =
      typeof body.folderId === "string" && body.folderId.trim()
        ? body.folderId.trim()
        : null;

    if (!title) {
      return Response.json({ error: "Note title is required" }, { status: 400 });
    }

    if (isRichTextEmpty(content)) {
      return Response.json({ error: "Note content is required" }, { status: 400 });
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

    if (folderId) {
      if (!ObjectId.isValid(folderId)) {
        return Response.json({ error: "Invalid folder id" }, { status: 400 });
      }

      const folder = await db.collection("noteFolders").findOne({
        _id: new ObjectId(folderId),
        projectId: projectObjectId,
        userId: auth.userId,
      });

      if (!folder) {
        return Response.json({ error: "Folder not found" }, { status: 404 });
      }

      if (
        !noteFolderMatchesScope(
          folder.featureId ? folder.featureId.toString() : null,
          featureId,
        )
      ) {
        return Response.json(
          { error: "Folder does not belong to this note scope" },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();
    const note: Omit<Note, "_id"> = {
      userId: auth.userId,
      projectId: projectObjectId,
      featureId: featureId ? new ObjectId(featureId) : null,
      folderId: folderId ? new ObjectId(folderId) : null,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db
      .collection<Omit<Note, "_id">>("notes")
      .insertOne(note);

    return Response.json(
      serializeNote({ ...note, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create note" }, { status: 500 });
  }
}
