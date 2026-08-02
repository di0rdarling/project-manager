"use client";

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
  const { onSuccess, onError, onMutate, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: sendChatMessage,
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
          _id: `pending-user-${Date.now()}`,
          userId: previousChat.userId,
          chatId: variables.chatId,
          role: "user",
          content: variables.content,
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<ChatWithMessagesResponse>(
          chatKeys.detail(variables.chatId),
          {
            ...previousChat,
            messages: [...previousChat.messages, optimisticUserMessage],
          },
        );
      }

      await onMutate?.(variables, mutationContext);

      return { previousChat };
    },
    onError: (error, variables, onMutateResult, mutationContext) => {
      if (onMutateResult?.previousChat) {
        queryClient.setQueryData(
          chatKeys.detail(variables.chatId),
          onMutateResult.previousChat,
        );
      }

      onError?.(error, variables, onMutateResult, mutationContext);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
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
            ...data.chat,
            project: current.project,
            requirement: current.requirement,
            feature: current.feature,
            modelId: data.chat.modelId ?? current.modelId,
            reasoningEffort:
              data.chat.reasoningEffort ?? current.reasoningEffort,
            contextUsage: data.contextUsage,
            messages: nextMessages,
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
