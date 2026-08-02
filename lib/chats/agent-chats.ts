import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  formatCompactDisplayDate,
  getRelativeDayLabel,
} from "@/lib/dates";
import type { ChatListItemResponse } from "@/lib/types";

export const RECENT_AGENT_CONVERSATIONS_LIMIT = 3;

export function filterAgentChats(
  chats: ChatListItemResponse[],
  teammateId: ChatTeammateId,
  projectId?: string | null,
): ChatListItemResponse[] {
  return chats.filter((chat) => {
    if (chat.teammateId !== teammateId) {
      return false;
    }

    if (projectId && chat.projectId !== projectId) {
      return false;
    }

    return true;
  });
}

export function getRecentAgentChats(
  chats: ChatListItemResponse[],
  limit = RECENT_AGENT_CONVERSATIONS_LIMIT,
): ChatListItemResponse[] {
  return chats.slice(0, limit);
}

export function formatConversationRelativeLabel(isoDate: string): string {
  const relativeDay = getRelativeDayLabel(isoDate, new Date());

  if (relativeDay === "today") {
    return "Today";
  }

  if (relativeDay === "yesterday") {
    return "Yesterday";
  }

  return formatCompactDisplayDate(isoDate);
}
