"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { archiveChat } from "@/lib/api/chats";
import {
  mergeChatListItem,
} from "@/lib/chats/chat-list-cache";
import { agentMemoryKeys, chatKeys } from "@/lib/query-keys";
import type { ChatListItemResponse, ChatResponse } from "@/lib/types";

type UseArchiveChatOptions = Omit<
  UseMutationOptions<ChatResponse, Error, string>,
  "mutationFn"
>;

export function useArchiveChat(options?: UseArchiveChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: archiveChat,
    ...restOptions,
    onSuccess: (archivedChat, chatId, onMutateResult, context) => {
      queryClient.setQueryData<ChatListItemResponse[]>(
        chatKeys.list("active"),
        (current) => current?.filter((chat) => chat._id !== chatId),
      );

      queryClient.setQueryData<ChatListItemResponse[]>(
        chatKeys.list("archived"),
        (current) => {
          const existing = current?.find((chat) => chat._id === chatId);
          const listItem = mergeChatListItem(existing, archivedChat);
          return current
            ? [listItem, ...current.filter((chat) => chat._id !== chatId)]
            : [listItem];
        },
      );

      queryClient.setQueryData(chatKeys.detail(chatId), (current) =>
        current ? { ...current, ...archivedChat } : current,
      );

      void queryClient.invalidateQueries({
        queryKey: agentMemoryKeys.detail(archivedChat.teammateId),
      });

      onSuccess?.(archivedChat, chatId, onMutateResult, context);
    },
  });
}
