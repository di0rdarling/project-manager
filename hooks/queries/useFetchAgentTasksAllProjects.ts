"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { agentTasksKeys } from "@/lib/query-keys";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTasksAllProjectsResponse } from "@/lib/types";

async function fetchAgentTasksAllProjects(
  teammateId: ChatTeammateId,
): Promise<AgentTasksAllProjectsResponse> {
  const response = await fetch(
    `/api/chats/agents/${teammateId}/tasks/all`,
  );
  const data = (await response.json()) as AgentTasksAllProjectsResponse & {
    error?: string;
  };
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to fetch tasks");
  }
  return data;
}

type UseFetchAgentTasksAllProjectsOptions = Omit<
  UseQueryOptions<AgentTasksAllProjectsResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentTasksAllProjects(
  teammateId: ChatTeammateId,
  options?: UseFetchAgentTasksAllProjectsOptions,
) {
  return useQuery({
    queryKey: agentTasksKeys.allProjects(teammateId),
    queryFn: () => fetchAgentTasksAllProjects(teammateId),
    ...options,
  });
}
