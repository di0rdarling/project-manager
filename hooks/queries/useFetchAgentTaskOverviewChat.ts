"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentTaskOverviewChat } from "@/lib/api/agent-task-overview-chat";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentTasksKeys } from "@/lib/query-keys";
import type { AgentTaskOverviewChatResponse } from "@/lib/types";

type UseFetchAgentTaskOverviewChatOptions = Omit<
  UseQueryOptions<AgentTaskOverviewChatResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentTaskOverviewChat(
  teammateId: ChatTeammateId,
  projectId: string,
  taskTitle: string,
  options?: UseFetchAgentTaskOverviewChatOptions,
) {
  return useQuery({
    queryKey: agentTasksKeys.overviewChat(teammateId, projectId, taskTitle),
    queryFn: () =>
      fetchAgentTaskOverviewChat({ teammateId, projectId, taskTitle }),
    ...options,
  });
}
