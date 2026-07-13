import { parseResponse } from "@/lib/api/response";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type {
  ChatListItemResponse,
  ChatResponse,
  ChatWithMessagesResponse,
  SendChatMessageResponse,
} from "@/lib/types";

export type ChatListStatus = "active" | "archived" | "all";

export async function fetchChats(
  status: ChatListStatus = "active",
): Promise<ChatListItemResponse[]> {
  const response = await fetch(`/api/chats?status=${status}`);
  return parseResponse<ChatListItemResponse[]>(response);
}

export async function fetchChat(chatId: string): Promise<ChatWithMessagesResponse> {
  const response = await fetch(`/api/chats/${chatId}`);
  return parseResponse<ChatWithMessagesResponse>(response);
}

export async function createChat(input: {
  projectId: string;
  teammateId: ChatTeammateId;
  requirementId?: string | null;
  featureId?: string | null;
  modelId?: ChatModelId;
}): Promise<ChatListItemResponse> {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<ChatListItemResponse>(response);
}

export async function sendChatMessage(input: {
  chatId: string;
  content: string;
}): Promise<SendChatMessageResponse> {
  const { chatId, content } = input;
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return parseResponse<SendChatMessageResponse>(response);
}

export async function updateChat(input: {
  chatId: string;
  title?: string;
  modelId?: ChatModelId;
}): Promise<ChatResponse> {
  const { chatId, title, modelId } = input;
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, modelId }),
  });

  return parseResponse<ChatResponse>(response);
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}

export async function archiveChat(chatId: string): Promise<ChatResponse> {
  const response = await fetch(`/api/chats/${chatId}/archive`, {
    method: "POST",
  });

  return parseResponse<ChatResponse>(response);
}

export async function unarchiveChat(chatId: string): Promise<ChatResponse> {
  const response = await fetch(`/api/chats/${chatId}/archive`, {
    method: "DELETE",
  });

  return parseResponse<ChatResponse>(response);
}
