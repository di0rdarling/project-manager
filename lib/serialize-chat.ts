import { toIsoString } from "@/lib/dates";
import type {
  Chat,
  ChatMessage,
  ChatMessageResponse,
  ChatResponse,
} from "@/lib/types";

export type StoredChat = Omit<Chat, "createdAt" | "updatedAt"> & {
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
    title: chat.title,
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
