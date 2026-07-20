import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { Note, NoteResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>;
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, noteId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(noteId)) {
      return Response.json({ error: "Invalid note id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const note = await client
      .db()
      .collection<StoredNote>("notes")
      .findOne({
        _id: new ObjectId(noteId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json(serializeNote(note));
  } catch {
    return Response.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, noteId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(noteId)) {
      return Response.json({ error: "Invalid note id" }, { status: 400 });
    }

    const body = await request.json();
    const hasTitle = Object.hasOwn(body, "title");
    const hasContent = Object.hasOwn(body, "content");
    const hasFolderId = Object.hasOwn(body, "folderId");

    if (!hasTitle && !hasContent && !hasFolderId) {
      return Response.json(
        { error: "No note fields provided to update" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(id);
    const noteObjectId = new ObjectId(noteId);

    const existingNote = await db.collection<StoredNote>("notes").findOne({
      _id: noteObjectId,
      projectId: projectObjectId,
      userId: auth.userId,
    });

    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const updates: {
      title?: string;
      content?: string;
      folderId?: ObjectId | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (hasTitle) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        return Response.json({ error: "Note title is required" }, { status: 400 });
      }
      updates.title = title;
    }

    if (hasContent) {
      const content =
        typeof body.content === "string" ? body.content.trim() : "";
      if (isRichTextEmpty(content)) {
        return Response.json(
          { error: "Note content is required" },
          { status: 400 },
        );
      }
      updates.content = content;
    }

    if (hasFolderId) {
      if (existingNote.featureId) {
        return Response.json(
          { error: "Folders are only supported for project-level notes" },
          { status: 400 },
        );
      }

      const folderId =
        body.folderId === null
          ? null
          : typeof body.folderId === "string" && body.folderId.trim()
            ? body.folderId.trim()
            : undefined;

      if (folderId === undefined) {
        return Response.json({ error: "Invalid folder id" }, { status: 400 });
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
      }

      updates.folderId = folderId ? new ObjectId(folderId) : null;
    }

    const result = await db.collection<StoredNote>("notes").findOneAndUpdate(
      {
        _id: noteObjectId,
        projectId: projectObjectId,
        userId: auth.userId,
      },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json(serializeNote(result));
  } catch {
    return Response.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id, noteId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(noteId)) {
      return Response.json({ error: "Invalid note id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("notes")
      .deleteOne({
        _id: new ObjectId(noteId),
        projectId: new ObjectId(id),
        userId: auth.userId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
