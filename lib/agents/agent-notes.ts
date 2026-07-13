import type { ObjectId } from "mongodb";
import {
  CHAT_TEAMMATE_IDS,
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";

export function agentNotesVisibilityFilter(
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Record<string, unknown> {
  return {
    userId,
    $or: [{ teammateId }, { sharedWithTeammateIds: teammateId }],
  };
}

export function parseSharedWithTeammateIds(
  value: unknown,
  ownerTeammateId: ChatTeammateId,
): ChatTeammateId[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const uniqueIds = new Set<ChatTeammateId>();

  for (const entry of value) {
    if (
      typeof entry === "string" &&
      isChatTeammateId(entry) &&
      entry !== ownerTeammateId
    ) {
      uniqueIds.add(entry);
    }
  }

  return [...uniqueIds].sort(
    (left, right) =>
      CHAT_TEAMMATE_IDS.indexOf(left) - CHAT_TEAMMATE_IDS.indexOf(right),
  );
}

export function isAgentNoteOwner(
  note: { teammateId: ChatTeammateId },
  viewingTeammateId: ChatTeammateId,
): boolean {
  return note.teammateId === viewingTeammateId;
}

export function getAgentNoteDetailPath(
  teammateId: ChatTeammateId,
  noteId: string,
) {
  return `/chats/agents/${teammateId}/notes/${noteId}`;
}

export function formatAgentNoteSharedWithNames(
  sharedWithTeammateIds: ChatTeammateId[],
): string | null {
  if (sharedWithTeammateIds.length === 0) {
    return null;
  }

  const names = sharedWithTeammateIds.map((id) => getChatTeammate(id).name);

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
