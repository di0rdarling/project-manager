"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateAgentTaskOverviewChat } from "@/lib/api/agent-task-overview-chat";
import { agentTasksKeys } from "@/lib/query-keys";
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

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
