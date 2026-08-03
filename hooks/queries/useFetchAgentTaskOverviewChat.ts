"use client";

import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentTaskOverviewChat } from "@/lib/api/agent-task-overview-chat";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentTasksKeys } from "@/lib/query-keys";
import { syncReviewChatFromOverviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: agentTasksKeys.overviewChat(teammateId, projectId, taskTitle),
    queryFn: async () => {
      const data = await fetchAgentTaskOverviewChat({
        teammateId,
        projectId,
        taskTitle,
      });

      if (data.task.outputDocumentId) {
        syncReviewChatFromOverviewChat(
          queryClient,
          teammateId,
          data.task.outputDocumentId,
          { projectId, taskTitle },
          data,
        );
      }

      return data;
    },
    ...options,
  });
}
