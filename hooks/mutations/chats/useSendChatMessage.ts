"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { sendChatMessage } from "@/lib/api/chats";
import { agentMemoryKeys, chatKeys } from "@/lib/query-keys";
import type {
  ChatResponse,
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
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChatWithMessagesResponse>(
        chatKeys.detail(variables.chatId),
        (current) => {
          if (!current) {
            return {
              ...data.chat,
              messages: [data.userMessage, data.assistantMessage],
            };
          }

          return {
            ...current,
            ...data.chat,
            messages: [
              ...current.messages,
              data.userMessage,
              data.assistantMessage,
            ],
          };
        },
      );

      queryClient.setQueryData<ChatResponse[]>(chatKeys.all, (current) =>
        current?.map((chat) =>
          chat._id === data.chat._id ? data.chat : chat,
        ),
      );

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(data.chat.teammateId),
      });

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
