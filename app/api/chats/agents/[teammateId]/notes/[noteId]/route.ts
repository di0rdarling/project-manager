import { ObjectId } from "mongodb";
import { isChatTeammateId } from "@/lib/chat-teammates";
import {
  AGENT_NOTES_COLLECTION,
  serializeAgentNote,
} from "@/lib/agent-notes-store";
import getClientPromise from "@/lib/mongodb";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { AgentNote } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string; noteId: string }>;
};

type StoredAgentNote = Omit<AgentNote, "_id" | "createdAt" | "updatedAt"> & {
  _id: AgentNote["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function parseRouteParams(teammateId: string, noteId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  if (!ObjectId.isValid(noteId)) {
    return {
      error: Response.json({ error: "Invalid note id" }, { status: 400 }),
    };
  }

  return { teammateId, noteId };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId, noteId: rawNoteId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawNoteId);

    if ("error" in parsed) {
      return parsed.error;
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
      .collection<StoredAgentNote>(AGENT_NOTES_COLLECTION)
      .findOneAndUpdate(
        {
          _id: new ObjectId(parsed.noteId),
          teammateId: parsed.teammateId,
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

    return Response.json(serializeAgentNote(result));
  } catch {
    return Response.json({ error: "Failed to update agent note" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId, noteId: rawNoteId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawNoteId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection(AGENT_NOTES_COLLECTION)
      .deleteOne({
        _id: new ObjectId(parsed.noteId),
        teammateId: parsed.teammateId,
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete agent note" }, { status: 500 });
  }
}
