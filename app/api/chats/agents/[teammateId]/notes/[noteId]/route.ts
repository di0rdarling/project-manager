import { ObjectId } from "mongodb";
import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import { parseSharedWithTeammateIds } from "@/lib/agents/agent-notes";
import {
  AGENT_NOTES_COLLECTION,
  getOwnedAgentNote,
  serializeAgentNote,
} from "@/lib/agents/agent-notes-store";
import { requireUserId } from "@/lib/current-user";
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, noteId: rawNoteId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawNoteId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const body = await request.json();
    const hasTitle = typeof body.title === "string";
    const hasContent = typeof body.content === "string";
    const hasSharedWith = Array.isArray(body.sharedWithTeammateIds);

    if (!hasTitle && !hasContent && !hasSharedWith) {
      return Response.json(
        { error: "No valid fields provided to update" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const existingNote = await getOwnedAgentNote(
      client.db(),
      auth.userId,
      parsed.teammateId,
      new ObjectId(parsed.noteId),
    );

    if (!existingNote) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (hasTitle || hasContent) {
      const title = hasTitle ? body.title.trim() : existingNote.title;
      const content = hasContent ? body.content.trim() : existingNote.content;

      if (!title) {
        return Response.json({ error: "Note title is required" }, { status: 400 });
      }

      if (isRichTextEmpty(content)) {
        return Response.json({ error: "Note content is required" }, { status: 400 });
      }

      updates.title = title;
      updates.content = content;
    }

    if (hasSharedWith) {
      const sharedWithTeammateIds = parseSharedWithTeammateIds(
        body.sharedWithTeammateIds,
        parsed.teammateId,
      );

      if (!sharedWithTeammateIds) {
        return Response.json(
          { error: "Invalid shared teammate ids" },
          { status: 400 },
        );
      }

      updates.sharedWithTeammateIds = sharedWithTeammateIds;
    }

    const result = await client
      .db()
      .collection<StoredAgentNote>(AGENT_NOTES_COLLECTION)
      .findOneAndUpdate(
        {
          _id: new ObjectId(parsed.noteId),
          userId: auth.userId,
          teammateId: parsed.teammateId,
        },
        { $set: updates },
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

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
        userId: auth.userId,
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
