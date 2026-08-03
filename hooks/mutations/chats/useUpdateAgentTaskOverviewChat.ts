"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateAgentTaskOverviewChat } from "@/lib/api/agent-task-overview-chat";
import { agentTasksKeys } from "@/lib/query-keys";
import { syncReviewChatFromOverviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
import type {
  AgentTaskOverviewChatResponse,
  UpdateAgentTaskOverviewChatResponse,
} from "@/lib/types";

type UpdateAgentTaskOverviewChatInput = Parameters<
  typeof updateAgentTaskOverviewChat
>[0];

type UseUpdateAgentTaskOverviewChatOptions = Omit<
  UseMutationOptions<
    UpdateAgentTaskOverviewChatResponse,
    Error,
    UpdateAgentTaskOverviewChatInput
  >,
  "mutationFn"
>;

export function useUpdateAgentTaskOverviewChat(
  options?: UseUpdateAgentTaskOverviewChatOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateAgentTaskOverviewChat,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentTaskOverviewChatResponse>(
        agentTasksKeys.overviewChat(
          variables.teammateId,
          variables.projectId,
          variables.taskTitle,
        ),
        (current) =>
          current
            ? {
                ...current,
                modelId: data.modelId,
                reasoningEffort: data.reasoningEffort,
                contextUsage: data.contextUsage,
              }
            : current,
      );

      const overviewChat = queryClient.getQueryData<AgentTaskOverviewChatResponse>(
        agentTasksKeys.overviewChat(
          variables.teammateId,
          variables.projectId,
          variables.taskTitle,
        ),
      );

      if (overviewChat?.task.outputDocumentId) {
        syncReviewChatFromOverviewChat(
          queryClient,
          variables.teammateId,
          overviewChat.task.outputDocumentId,
          {
            projectId: variables.projectId,
            taskTitle: variables.taskTitle,
          },
          overviewChat,
        );
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
