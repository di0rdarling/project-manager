import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import type {
  ChatListItemResponse,
  ChatResponse,
  ChatWithMessagesResponse,
  SendChatMessageResponse,
} from "@/lib/types";

export async function fetchChats(): Promise<ChatListItemResponse[]> {
  const response = await fetch("/api/chats");
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
}): Promise<ChatResponse> {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<ChatResponse>(response);
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
  title: string;
}): Promise<ChatResponse> {
  const { chatId, title } = input;
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  return parseResponse<ChatResponse>(response);
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
