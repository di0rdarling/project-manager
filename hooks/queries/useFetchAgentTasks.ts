"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentTasks } from "@/lib/api/agent-tasks";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentTasksKeys } from "@/lib/query-keys";
import type { AgentTasksResponse } from "@/lib/types";

type UseFetchAgentTasksOptions = Omit<
  UseQueryOptions<AgentTasksResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentTasks(
  teammateId: ChatTeammateId,
  projectId: string | null | undefined,
  options?: UseFetchAgentTasksOptions,
) {
  return useQuery({
    queryKey: agentTasksKeys.detail(teammateId, projectId ?? ""),
    queryFn: () =>
      fetchAgentTasks({ teammateId, projectId: projectId as string }),
    enabled: Boolean(projectId),
    ...options,
  });
}
