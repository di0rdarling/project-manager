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
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: sendDocumentReviewMessage,
    retry: false,
    ...restOptions,
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

          const existingMessageIds = new Set(
            current.messages.map((entry) => entry._id),
          );
          const nextMessages = [...current.messages];

          if (!existingMessageIds.has(data.userMessage._id)) {
            nextMessages.push(data.userMessage);
          }

          if (!existingMessageIds.has(data.assistantMessage._id)) {
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
