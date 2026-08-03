"use client";

import { useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendDocumentReviewMessage } from "@/lib/api/agent-document-review-chat";
import {
  appendAssistantStreamDelta,
  createOptimisticAssistantMessage,
  createOptimisticUserMessage,
  finalizePendingChatMessages,
} from "@/lib/chats/streaming-chat-mutation-helpers";
import { agentDocumentKeys, agentMemoryKeys } from "@/lib/query-keys";
import { syncOverviewChatFromReviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
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
  const streamingAssistantMessageIdRef = useRef<string | null>(null);
  const { onSuccess, onError, onMutate, ...restOptions } = options ?? {};

  return useMutation({
    retry: false,
    ...restOptions,
    onMutate: async (variables, mutationContext) => {
      const queryKey = agentDocumentKeys.reviewChat(
        variables.teammateId,
        variables.documentId,
      );

      await queryClient.cancelQueries({ queryKey });

      const previousReviewChat =
        queryClient.getQueryData<AgentDocumentReviewChatResponse>(queryKey);

      const optimisticUserMessage = createOptimisticUserMessage(
        variables.content,
      );
      const optimisticAssistantMessage = createOptimisticAssistantMessage();
      streamingAssistantMessageIdRef.current = optimisticAssistantMessage._id;

      if (previousReviewChat) {
        queryClient.setQueryData<AgentDocumentReviewChatResponse>(queryKey, {
          ...previousReviewChat,
          messages: [
            ...previousReviewChat.messages,
            optimisticUserMessage,
            optimisticAssistantMessage,
          ],
        });
      }

      await onMutate?.(variables, mutationContext);

      return { previousReviewChat };
    },
    mutationFn: async (variables) => {
      const queryKey = agentDocumentKeys.reviewChat(
        variables.teammateId,
        variables.documentId,
      );

      return sendDocumentReviewMessage({
        ...variables,
        onToken: (delta) => {
          const assistantMessageId = streamingAssistantMessageIdRef.current;

          if (!assistantMessageId) {
            return;
          }

          queryClient.setQueryData<AgentDocumentReviewChatResponse>(
            queryKey,
            (current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                messages: appendAssistantStreamDelta(
                  current.messages,
                  assistantMessageId,
                  delta,
                ),
              };
            },
          );
        },
      });
    },
    onError: (error, variables, onMutateResult, mutationContext) => {
      streamingAssistantMessageIdRef.current = null;

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
      streamingAssistantMessageIdRef.current = null;

      let nextReviewChat: AgentDocumentReviewChatResponse | undefined;

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
              taskConversation: data.taskConversation,
              modelId: data.modelId,
              reasoningEffort: data.reasoningEffort,
              conversationSummary: data.conversationSummary,
              contextUsage: data.contextUsage,
            };
          }

          nextReviewChat = {
            ...current,
            document: data.document,
            taskConversation: data.taskConversation ?? current.taskConversation,
            messages: finalizePendingChatMessages(
              current.messages,
              data.userMessage,
              data.assistantMessage,
            ),
            modelId: data.modelId,
            reasoningEffort: data.reasoningEffort,
            conversationSummary: data.conversationSummary,
            contextUsage: data.contextUsage,
          };

          return nextReviewChat;
        },
      );

      syncOverviewChatFromReviewChat(
        queryClient,
        variables.teammateId,
        data.taskConversation,
        {
          messages:
            nextReviewChat?.messages ?? [data.userMessage, data.assistantMessage],
          modelId: data.modelId,
          reasoningEffort: data.reasoningEffort,
          conversationSummary: data.conversationSummary,
          contextUsage: data.contextUsage,
          task: nextReviewChat?.task ?? null,
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
