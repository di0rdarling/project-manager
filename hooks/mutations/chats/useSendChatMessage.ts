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
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: sendChatMessage,
    retry: false,
    ...restOptions,
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
