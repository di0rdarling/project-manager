import { ObjectId } from "mongodb";
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
    projectId: note.projectId.toString(),
    title: typeof note.title === "string" ? note.title : "",
    content: note.content,
    createdAt: toIsoString(note.createdAt),
    updatedAt: note.updatedAt
      ? toIsoString(note.updatedAt)
      : toIsoString(note.createdAt),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, noteId } = await context.params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid project id" }, { status: 400 });
    }

    if (!ObjectId.isValid(noteId)) {
      return Response.json({ error: "Invalid note id" }, { status: 400 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!title) {
      return Response.json({ error: "Note title is required" }, { status: 400 });
    }

    if (isRichTextEmpty(content)) {
      return Response.json({ error: "Note content is required" }, { status: 400 });
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<StoredNote>("notes")
      .findOneAndUpdate(
        {
          _id: new ObjectId(noteId),
          projectId: new ObjectId(id),
        },
        {
          $set: {
            title,
            content,
            updatedAt: new Date().toISOString(),
          },
        },
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
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
