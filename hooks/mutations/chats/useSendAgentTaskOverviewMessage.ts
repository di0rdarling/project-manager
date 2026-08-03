"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendAgentTaskOverviewMessage } from "@/lib/api/agent-task-overview-chat";
import { agentMemoryKeys, agentTasksKeys } from "@/lib/query-keys";
import { syncReviewChatFromOverviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
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
      const currentTaskTitle = data.task.title;
      const titleChanged = currentTaskTitle !== variables.taskTitle;
      const sourceQueryKey = agentTasksKeys.overviewChat(
        variables.teammateId,
        variables.projectId,
        variables.taskTitle,
      );
      const nextQueryKey = agentTasksKeys.overviewChat(
        variables.teammateId,
        variables.projectId,
        currentTaskTitle,
      );

      const applyUpdate = (
        current: AgentTaskOverviewChatResponse | undefined,
      ): AgentTaskOverviewChatResponse => {
        if (!current) {
          return {
            messages: [data.userMessage, data.assistantMessage],
            task: data.task,
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
          task: data.task,
          modelId: data.modelId,
          reasoningEffort: data.reasoningEffort,
          conversationSummary: data.conversationSummary,
          contextUsage: data.contextUsage,
        };
      };

      const sourceChat =
        queryClient.getQueryData<AgentTaskOverviewChatResponse>(sourceQueryKey);
      queryClient.setQueryData(nextQueryKey, applyUpdate(sourceChat));

      if (titleChanged) {
        queryClient.removeQueries({ queryKey: sourceQueryKey });
      }

      const nextOverviewChat =
        queryClient.getQueryData<AgentTaskOverviewChatResponse>(nextQueryKey);

      if (nextOverviewChat?.task.outputDocumentId) {
        syncReviewChatFromOverviewChat(
          queryClient,
          variables.teammateId,
          nextOverviewChat.task.outputDocumentId,
          {
            projectId: variables.projectId,
            taskTitle: currentTaskTitle,
          },
          nextOverviewChat,
        );
      }

      void queryClient.invalidateQueries({
        queryKey: agentTasksKeys.detail(
          variables.teammateId,
          variables.projectId,
        ),
      });

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(variables.teammateId),
      });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
