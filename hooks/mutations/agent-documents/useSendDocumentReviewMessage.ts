"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendDocumentReviewMessage } from "@/lib/api/agent-document-review-chat";
import { agentDocumentKeys, agentMemoryKeys } from "@/lib/query-keys";
import type {
  AgentDocumentReviewChatResponse,
  SendDocumentReviewMessageResponse,
} from "@/lib/types";

type SendDocumentReviewMessageInput = Parameters<
  typeof sendDocumentReviewMessage
>[0];

type UseSendDocumentReviewMessageOptions = Omit<
  UseMutationOptions<
    SendDocumentReviewMessageResponse,
    Error,
    SendDocumentReviewMessageInput
  >,
  "mutationFn"
>;

export function useSendDocumentReviewMessage(
  options?: UseSendDocumentReviewMessageOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onMutate, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: sendDocumentReviewMessage,
    retry: false,
    ...restOptions,
    onMutate: async (variables, mutationContext) => {
      await queryClient.cancelQueries({
        queryKey: agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
        ),
      });

      const previousReviewChat =
        queryClient.getQueryData<AgentDocumentReviewChatResponse>(
          agentDocumentKeys.reviewChat(
            variables.teammateId,
            variables.documentId,
          ),
        );

      if (previousReviewChat) {
        const optimisticUserMessage: AgentDocumentReviewChatResponse["messages"][number] =
          {
            _id: `pending-user-${Date.now()}`,
            role: "user",
            content: variables.content,
            createdAt: new Date().toISOString(),
          };

        queryClient.setQueryData<AgentDocumentReviewChatResponse>(
          agentDocumentKeys.reviewChat(
            variables.teammateId,
            variables.documentId,
          ),
          {
            ...previousReviewChat,
            messages: [...previousReviewChat.messages, optimisticUserMessage],
          },
        );
      }

      await onMutate?.(variables, mutationContext);

      return { previousReviewChat };
    },
    onError: (error, variables, onMutateResult, mutationContext) => {
      if (onMutateResult?.previousReviewChat) {
        queryClient.setQueryData(
          agentDocumentKeys.reviewChat(
            variables.teammateId,
            variables.documentId,
          ),
          onMutateResult.previousReviewChat,
        );
      }

      onError?.(error, variables, onMutateResult, mutationContext);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentDocumentReviewChatResponse>(
        agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
        ),
        (current) => {
          if (!current) {
            return {
              messages: [data.userMessage, data.assistantMessage],
              document: data.document,
              task: null,
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
            document: data.document,
            messages: nextMessages,
            modelId: data.modelId,
            reasoningEffort: data.reasoningEffort,
            conversationSummary: data.conversationSummary,
            contextUsage: data.contextUsage,
          };
        },
      );

      queryClient.setQueryData(
        agentDocumentKeys.detail(variables.teammateId, variables.documentId),
        data.document,
      );

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(variables.teammateId),
      });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
