"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateChat } from "@/lib/api/chats";
import {
  mergeChatListItem,
  updateAllChatListCaches,
} from "@/lib/chats/chat-list-cache";
import { chatKeys } from "@/lib/query-keys";
import type {
  ChatResponse,
  ChatWithMessagesResponse,
} from "@/lib/types";

type UpdateChatInput = Parameters<typeof updateChat>[0];

type UseUpdateChatOptions = Omit<
  UseMutationOptions<ChatResponse, Error, UpdateChatInput>,
  "mutationFn"
>;

export function useUpdateChat(options?: UseUpdateChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateChat,
    ...restOptions,
    onSuccess: (updatedChat, variables, onMutateResult, context) => {
      updateAllChatListCaches(queryClient, (current) =>
        current?.map((chat) =>
          chat._id === updatedChat._id
            ? mergeChatListItem(chat, updatedChat)
            : chat,
        ),
      );

      queryClient.setQueryData<ChatWithMessagesResponse>(
        chatKeys.detail(variables.chatId),
        (current) =>
          current ? { ...current, ...updatedChat } : current,
      );

      onSuccess?.(updatedChat, variables, onMutateResult, context);
    },
  });
}
