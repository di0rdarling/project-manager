import type { UserMemoryResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export async function fetchUserMemory(
  teammateId: ChatTeammateId,
): Promise<UserMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/user-memory`);
  return parseResponse<UserMemoryResponse>(response);
}

export async function generateUserMemory(
  teammateId: ChatTeammateId,
): Promise<UserMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/user-memory`, {
    method: "POST",
  });

  return parseResponse<UserMemoryResponse>(response);
}

export async function deleteUserMemory(
  teammateId: ChatTeammateId,
): Promise<UserMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/user-memory`, {
    method: "DELETE",
  });

  return parseResponse<UserMemoryResponse>(response);
}
