"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { unarchiveChat } from "@/lib/api/chats";
import {
  mergeChatListItem,
} from "@/lib/chat-list-cache";
import { chatKeys } from "@/lib/query-keys";
import type { ChatListItemResponse, ChatResponse } from "@/lib/types";

type UseUnarchiveChatOptions = Omit<
  UseMutationOptions<ChatResponse, Error, string>,
  "mutationFn"
>;

export function useUnarchiveChat(options?: UseUnarchiveChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: unarchiveChat,
    ...restOptions,
    onSuccess: (unarchivedChat, chatId, onMutateResult, context) => {
      queryClient.setQueryData<ChatListItemResponse[]>(
        chatKeys.list("archived"),
        (current) => current?.filter((chat) => chat._id !== chatId),
      );

      queryClient.setQueryData<ChatListItemResponse[]>(
        chatKeys.list("active"),
        (current) => {
          const existing = current?.find((chat) => chat._id === chatId);
          const listItem = mergeChatListItem(existing, unarchivedChat);
          return current
            ? [listItem, ...current.filter((chat) => chat._id !== chatId)]
            : [listItem];
        },
      );

      queryClient.setQueryData(chatKeys.detail(chatId), (current) =>
        current ? { ...current, ...unarchivedChat } : current,
      );

      onSuccess?.(unarchivedChat, chatId, onMutateResult, context);
    },
  });
}
