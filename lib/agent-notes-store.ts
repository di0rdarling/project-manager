import type { Db } from "mongodb";
import {
  agentNotesVisibilityFilter,
  parseSharedWithTeammateIds,
} from "@/lib/agent-notes";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import { toIsoString } from "@/lib/dates";
import { stripRichText } from "@/lib/rich-text";
import type { AgentNote } from "@/lib/types";

export const AGENT_NOTES_COLLECTION = "agent_notes";

type StoredAgentNote = Omit<AgentNote, "_id" | "createdAt" | "updatedAt"> & {
  _id: AgentNote["_id"];
  createdAt: string | Date;
  updatedAt: string | Date;
  sharedWithTeammateIds?: ChatTeammateId[];
};

export type AgentNoteContextItem = {
  title: string;
  content: string;
  isOwned: boolean;
};

export async function getAgentNotes(
  db: Db,
  teammateId: ChatTeammateId,
): Promise<AgentNoteContextItem[]> {
  const notes = await db
    .collection<StoredAgentNote>(AGENT_NOTES_COLLECTION)
    .find(agentNotesVisibilityFilter(teammateId))
    .sort({ createdAt: -1 })
    .toArray();

  return notes
    .map((note) => {
      const ownerTeammateId = isChatTeammateId(note.teammateId)
        ? note.teammateId
        : DEFAULT_CHAT_TEAMMATE_ID;

      return {
        title: typeof note.title === "string" ? note.title.trim() : "",
        content: stripRichText(note.content),
        isOwned: ownerTeammateId === teammateId,
      };
    })
    .filter((note) => note.title.length > 0 || note.content.trim().length > 0);
}

export function serializeAgentNote(note: StoredAgentNote) {
  const ownerTeammateId = isChatTeammateId(note.teammateId)
    ? note.teammateId
    : DEFAULT_CHAT_TEAMMATE_ID;

  return {
    _id: note._id.toString(),
    teammateId: ownerTeammateId,
    sharedWithTeammateIds:
      parseSharedWithTeammateIds(
        note.sharedWithTeammateIds ?? [],
        ownerTeammateId,
      ) ?? [],
    title: typeof note.title === "string" ? note.title : "",
    content: note.content,
    createdAt: toIsoString(note.createdAt),
    updatedAt: note.updatedAt
      ? toIsoString(note.updatedAt)
      : toIsoString(note.createdAt),
  };
}

export async function getOwnedAgentNote(
  db: Db,
  ownerTeammateId: ChatTeammateId,
  noteId: import("mongodb").ObjectId,
): Promise<StoredAgentNote | null> {
  return db.collection<StoredAgentNote>(AGENT_NOTES_COLLECTION).findOne({
    _id: noteId,
    teammateId: ownerTeammateId,
  });
}
