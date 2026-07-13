import type { AgentMemoryResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export async function fetchAgentMemory(
  teammateId: ChatTeammateId,
): Promise<AgentMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/memory`);
  return parseResponse<AgentMemoryResponse>(response);
}

export async function generateAgentMemory(
  teammateId: ChatTeammateId,
): Promise<AgentMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/memory`, {
    method: "POST",
  });

  return parseResponse<AgentMemoryResponse>(response);
}

export async function deleteAgentMemory(
  teammateId: ChatTeammateId,
): Promise<AgentMemoryResponse> {
  const response = await fetch(`/api/chats/agents/${teammateId}/memory`, {
    method: "DELETE",
  });

  return parseResponse<AgentMemoryResponse>(response);
}
