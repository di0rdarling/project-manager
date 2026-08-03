"use client";

import { useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendChatMessage } from "@/lib/api/chats";
import {
  mergeChatListItem,
  updateAllChatListCaches,
} from "@/lib/chats/chat-list-cache";
import {
  appendAssistantStreamDelta,
  createOptimisticAssistantMessage,
  createOptimisticUserMessage,
  finalizePendingChatMessages,
} from "@/lib/chats/streaming-chat-mutation-helpers";
import { agentMemoryKeys, chatKeys } from "@/lib/query-keys";
import type {
  ChatMessageResponse,
  ChatWithMessagesResponse,
  SendChatMessageResponse,
} from "@/lib/types";

type SendChatMessageInput = Parameters<typeof sendChatMessage>[0];

type UseSendChatMessageOptions = Omit<
  UseMutationOptions<SendChatMessageResponse, Error, SendChatMessageInput>,
  "mutationFn"
>;

export function useSendChatMessage(options?: UseSendChatMessageOptions) {
  const queryClient = useQueryClient();
  const streamingAssistantMessageIdRef = useRef<string | null>(null);
  const { onSuccess, onError, onMutate, ...restOptions } = options ?? {};

  return useMutation({
    retry: false,
    ...restOptions,
    onMutate: async (variables, mutationContext) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.detail(variables.chatId),
      });

      const previousChat = queryClient.getQueryData<ChatWithMessagesResponse>(
        chatKeys.detail(variables.chatId),
      );

      if (previousChat) {
        const optimisticUserMessage: ChatMessageResponse = {
          _id: createOptimisticUserMessage(variables.content)._id,
          userId: previousChat.userId,
          chatId: variables.chatId,
          role: "user",
          content: variables.content,
          createdAt: new Date().toISOString(),
        };
        const optimisticAssistantMessage: ChatMessageResponse = {
          _id: createOptimisticAssistantMessage()._id,
          userId: previousChat.userId,
          chatId: variables.chatId,
          role: "model",
          content: "",
          createdAt: new Date().toISOString(),
        };
        streamingAssistantMessageIdRef.current = optimisticAssistantMessage._id;

        queryClient.setQueryData<ChatWithMessagesResponse>(
          chatKeys.detail(variables.chatId),
          {
            ...previousChat,
            messages: [
              ...previousChat.messages,
              optimisticUserMessage,
              optimisticAssistantMessage,
            ],
          },
        );
      }

      await onMutate?.(variables, mutationContext);

      return { previousChat };
    },
    mutationFn: async (variables) =>
      sendChatMessage({
        ...variables,
        onToken: (delta) => {
          const assistantMessageId = streamingAssistantMessageIdRef.current;

          if (!assistantMessageId) {
            return;
          }

          queryClient.setQueryData<ChatWithMessagesResponse>(
            chatKeys.detail(variables.chatId),
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
      }),
    onError: (error, variables, onMutateResult, mutationContext) => {
      streamingAssistantMessageIdRef.current = null;

      if (onMutateResult?.previousChat) {
        queryClient.setQueryData(
          chatKeys.detail(variables.chatId),
          onMutateResult.previousChat,
        );
      }

      onError?.(error, variables, onMutateResult, mutationContext);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      streamingAssistantMessageIdRef.current = null;

      queryClient.setQueryData<ChatWithMessagesResponse>(
        chatKeys.detail(variables.chatId),
        (current) => {
          if (!current) {
            return {
              ...data.chat,
              project: null,
              requirement: null,
              feature: null,
              contextUsage: data.contextUsage,
              messages: [data.userMessage, data.assistantMessage],
            };
          }

          return {
            ...current,
            ...data.chat,
            project: current.project,
            requirement: current.requirement,
            feature: current.feature,
            modelId: data.chat.modelId ?? current.modelId,
            reasoningEffort:
              data.chat.reasoningEffort ?? current.reasoningEffort,
            contextUsage: data.contextUsage,
            messages: finalizePendingChatMessages(
              current.messages,
              data.userMessage,
              data.assistantMessage,
            ),
          };
        },
      );

      updateAllChatListCaches(queryClient, (current) =>
        current?.map((chat) =>
          chat._id === data.chat._id
            ? mergeChatListItem(chat, data.chat)
            : chat,
        ),
      );

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(data.chat.teammateId),
      });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
