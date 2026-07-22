import type { AgentTaskStatus, AgentTasksResponse } from "@/lib/types";
import { parseResponse } from "@/lib/api/response";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export type AgentTasksRequest = {
  teammateId: ChatTeammateId;
  projectId: string;
};

export type UpdateAgentTaskStatusRequest = AgentTasksRequest & {
  taskTitle: string;
  status: Exclude<AgentTaskStatus, "pending">;
};

export type StartAgentTaskOutputRequest = AgentTasksRequest & {
  taskTitle: string;
};

function getAgentTasksUrl({ teammateId, projectId }: AgentTasksRequest): string {
  const params = new URLSearchParams({ projectId });
  return `/api/chats/agents/${teammateId}/tasks?${params.toString()}`;
}

function getAgentTaskOutputUrl({
  teammateId,
  projectId,
}: AgentTasksRequest): string {
  const params = new URLSearchParams({ projectId });
  return `/api/chats/agents/${teammateId}/tasks/output?${params.toString()}`;
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

export async function updateAgentTaskStatusRequest(
  input: UpdateAgentTaskStatusRequest,
): Promise<AgentTasksResponse> {
  const { taskTitle, status, ...request } = input;
  const response = await fetch(getAgentTasksUrl(request), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskTitle, status }),
  });

  return parseResponse<AgentTasksResponse>(response);
}

export async function startAgentTaskOutputRequest(
  input: StartAgentTaskOutputRequest,
): Promise<AgentTasksResponse> {
  const { taskTitle, ...request } = input;
  const response = await fetch(getAgentTaskOutputUrl(request), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskTitle }),
  });

  return parseResponse<AgentTasksResponse>(response);
}
