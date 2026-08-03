"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendAgentTaskOverviewMessage } from "@/lib/api/agent-task-overview-chat";
import { agentMemoryKeys, agentTasksKeys } from "@/lib/query-keys";
import type {
  AgentTaskOverviewChatResponse,
  SendAgentTaskOverviewMessageResponse,
} from "@/lib/types";

type SendAgentTaskOverviewMessageInput = Parameters<
  typeof sendAgentTaskOverviewMessage
>[0];

type UseSendAgentTaskOverviewMessageOptions = Omit<
  UseMutationOptions<
    SendAgentTaskOverviewMessageResponse,
    Error,
    SendAgentTaskOverviewMessageInput
  >,
  "mutationFn"
>;

export function useSendAgentTaskOverviewMessage(
  options?: UseSendAgentTaskOverviewMessageOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onMutate, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: sendAgentTaskOverviewMessage,
    retry: false,
    ...restOptions,
    onMutate: async (variables, mutationContext) => {
      const queryKey = agentTasksKeys.overviewChat(
        variables.teammateId,
        variables.projectId,
        variables.taskTitle,
      );

      await queryClient.cancelQueries({ queryKey });

      const previousOverviewChat =
        queryClient.getQueryData<AgentTaskOverviewChatResponse>(queryKey);

      if (previousOverviewChat) {
        const optimisticUserMessage: AgentTaskOverviewChatResponse["messages"][number] =
          {
            _id: `pending-user-${Date.now()}`,
            role: "user",
            content: variables.content,
            createdAt: new Date().toISOString(),
          };

        queryClient.setQueryData<AgentTaskOverviewChatResponse>(queryKey, {
          ...previousOverviewChat,
          messages: [...previousOverviewChat.messages, optimisticUserMessage],
        });
      }

      await onMutate?.(variables, mutationContext);

      return { previousOverviewChat, queryKey };
    },
    onError: (error, variables, onMutateResult, mutationContext) => {
      if (onMutateResult?.previousOverviewChat && onMutateResult.queryKey) {
        queryClient.setQueryData(
          onMutateResult.queryKey,
          onMutateResult.previousOverviewChat,
        );
      }

      onError?.(error, variables, onMutateResult, mutationContext);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      const queryKey = agentTasksKeys.overviewChat(
        variables.teammateId,
        variables.projectId,
        variables.taskTitle,
      );

      queryClient.setQueryData<AgentTaskOverviewChatResponse>(
        queryKey,
        (current) => {
          if (!current) {
            return {
              messages: [data.userMessage, data.assistantMessage],
              task: {
                title: variables.taskTitle,
                detail: "",
                rationale: "",
                impact: "",
                riskIfSkipped: "",
                outputDescription: "",
              },
              modelId: data.modelId,
              reasoningEffort: data.reasoningEffort,
              conversationSummary: data.conversationSummary,
              contextUsage: data.contextUsage,
            };
          }

          const nextMessages = current.messages.filter(
            (entry) => !entry._id.startsWith("pending-user-"),
          );

          if (!nextMessages.some((entry) => entry._id === data.userMessage._id)) {
            nextMessages.push(data.userMessage);
          }

          if (
            !nextMessages.some((entry) => entry._id === data.assistantMessage._id)
          ) {
            nextMessages.push(data.assistantMessage);
          }

          return {
            ...current,
            messages: nextMessages,
            modelId: data.modelId,
            reasoningEffort: data.reasoningEffort,
            conversationSummary: data.conversationSummary,
            contextUsage: data.contextUsage,
          };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(variables.teammateId),
      });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
