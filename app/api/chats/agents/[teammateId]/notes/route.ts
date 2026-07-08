import { isChatTeammateId } from "@/lib/chat-teammates";
import {
  AGENT_NOTES_COLLECTION,
  serializeAgentNote,
} from "@/lib/agent-notes-store";
import { agentNotesVisibilityFilter } from "@/lib/agent-notes";
import getClientPromise from "@/lib/mongodb";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { AgentNote } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

type StoredAgentNote = Omit<AgentNote, "_id" | "createdAt" | "updatedAt"> & {
  _id: AgentNote["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

function parseTeammateId(teammateId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  return { teammateId };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const notes = await client
      .db()
      .collection<StoredAgentNote>(AGENT_NOTES_COLLECTION)
      .find(agentNotesVisibilityFilter(parsed.teammateId))
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(notes.map(serializeAgentNote));
  } catch {
    return Response.json({ error: "Failed to fetch agent notes" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

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

    const now = new Date().toISOString();
    const note: Omit<AgentNote, "_id"> = {
      teammateId: parsed.teammateId,
      sharedWithTeammateIds: [],
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const client = await getClientPromise();
    const insertResult = await client
      .db()
      .collection<Omit<AgentNote, "_id">>(AGENT_NOTES_COLLECTION)
      .insertOne(note);

    return Response.json(
      serializeAgentNote({ ...note, _id: insertResult.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create agent note" }, { status: 500 });
  }
}
