import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import type {
  ChatResponse,
  ChatWithMessagesResponse,
  SendChatMessageResponse,
} from "@/lib/types";

export async function fetchChats(): Promise<ChatResponse[]> {
  const response = await fetch("/api/chats");
  return parseResponse<ChatResponse[]>(response);
}

export async function fetchChat(chatId: string): Promise<ChatWithMessagesResponse> {
  const response = await fetch(`/api/chats/${chatId}`);
  return parseResponse<ChatWithMessagesResponse>(response);
}

export async function createChat(input: {
  projectId: string;
  teammateId: ChatTeammateId;
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

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}
