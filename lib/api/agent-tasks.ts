import type { AgentTasksResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export type AgentTasksRequest = {
  teammateId: ChatTeammateId;
  projectId: string;
};

function getAgentTasksUrl({ teammateId, projectId }: AgentTasksRequest): string {
  const params = new URLSearchParams({ projectId });
  return `/api/chats/agents/${teammateId}/tasks?${params.toString()}`;
}

export async function fetchAgentTasks(
  input: AgentTasksRequest,
): Promise<AgentTasksResponse> {
  const response = await fetch(getAgentTasksUrl(input));
  return parseResponse<AgentTasksResponse>(response);
}

export async function generateAgentTasksRequest(
  input: AgentTasksRequest,
): Promise<AgentTasksResponse> {
  const response = await fetch(getAgentTasksUrl(input), {
    method: "POST",
  });

  return parseResponse<AgentTasksResponse>(response);
}

export async function deleteAgentTasks(
  input: AgentTasksRequest,
): Promise<AgentTasksResponse> {
  const response = await fetch(getAgentTasksUrl(input), {
    method: "DELETE",
  });

  return parseResponse<AgentTasksResponse>(response);
}
