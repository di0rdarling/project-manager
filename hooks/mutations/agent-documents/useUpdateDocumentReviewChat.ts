"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateDocumentReviewChat } from "@/lib/api/agent-document-review-chat";
import { agentDocumentKeys } from "@/lib/query-keys";
import { syncOverviewChatFromReviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
import type {
  AgentDocumentReviewChatResponse,
  UpdateDocumentReviewChatResponse,
} from "@/lib/types";

type UpdateDocumentReviewChatInput = Parameters<
  typeof updateDocumentReviewChat
>[0];

type UseUpdateDocumentReviewChatOptions = Omit<
  UseMutationOptions<
    UpdateDocumentReviewChatResponse,
    Error,
    UpdateDocumentReviewChatInput
  >,
  "mutationFn"
>;

export function useUpdateDocumentReviewChat(
  options?: UseUpdateDocumentReviewChatOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateDocumentReviewChat,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentDocumentReviewChatResponse>(
        agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
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

      const reviewChat = queryClient.getQueryData<AgentDocumentReviewChatResponse>(
        agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
        ),
      );

      if (reviewChat) {
        syncOverviewChatFromReviewChat(
          queryClient,
          variables.teammateId,
          reviewChat.taskConversation,
          reviewChat,
        );
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
