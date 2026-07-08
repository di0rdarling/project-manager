import { DEFAULT_CHAT_TEAMMATE_ID, isChatTeammateId } from "@/lib/chat-teammates";
import { toIsoString } from "@/lib/dates";
import type {
  Chat,
  ChatMessage,
  ChatMessageResponse,
  ChatResponse,
} from "@/lib/types";

export type StoredChat = Omit<
  Chat,
  | "createdAt"
  | "updatedAt"
  | "teammateId"
  | "requirementId"
  | "featureId"
  | "titleIsCustom"
  | "aiTitleGenerated"
> & {
  requirementId?: Chat["requirementId"];
  featureId?: Chat["featureId"];
  teammateId?: Chat["teammateId"];
  titleIsCustom?: Chat["titleIsCustom"];
  aiTitleGenerated?: Chat["aiTitleGenerated"];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type StoredChatMessage = Omit<ChatMessage, "chatId" | "createdAt"> & {
  chatId: ChatMessage["chatId"];
  createdAt: string | Date;
};

export function serializeChat(chat: StoredChat): ChatResponse {
  return {
    _id: chat._id.toString(),
    projectId: chat.projectId ? chat.projectId.toString() : null,
    requirementId: chat.requirementId ? chat.requirementId.toString() : null,
    featureId: chat.featureId ? chat.featureId.toString() : null,
    teammateId: isChatTeammateId(chat.teammateId)
      ? chat.teammateId
      : DEFAULT_CHAT_TEAMMATE_ID,
    title: chat.title,
    titleIsCustom: chat.titleIsCustom ?? false,
    aiTitleGenerated: chat.aiTitleGenerated ?? false,
    conversationSummary: chat.conversationSummary ?? null,
    createdAt: toIsoString(chat.createdAt),
    updatedAt: toIsoString(chat.updatedAt),
  };
}

export function serializeChatMessage(
  message: StoredChatMessage,
): ChatMessageResponse {
  return {
    _id: message._id.toString(),
    chatId: message.chatId.toString(),
    role: message.role,
    content: message.content,
    ...(message.sources?.length ? { sources: message.sources } : {}),
    ...(message.webSearchQueries?.length
      ? { webSearchQueries: message.webSearchQueries }
      : {}),
    ...(message.searchSuggestionsHtml
      ? { searchSuggestionsHtml: message.searchSuggestionsHtml }
      : {}),
    createdAt: toIsoString(message.createdAt),
  };
}

export function buildChatTitleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "New Chat";
  }

  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}
