"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteChat } from "@/lib/api/chats";
import { chatKeys } from "@/lib/query-keys";
import type { ChatResponse } from "@/lib/types";

type UseDeleteChatOptions = Omit<
  UseMutationOptions<void, Error, string>,
  "mutationFn"
>;

export function useDeleteChat(options?: UseDeleteChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteChat,
    ...restOptions,
    onSuccess: (data, chatId, onMutateResult, context) => {
      queryClient.setQueryData<ChatResponse[]>(chatKeys.all, (current) =>
        current?.filter((chat) => chat._id !== chatId),
      );
      queryClient.removeQueries({ queryKey: chatKeys.detail(chatId) });
      onSuccess?.(data, chatId, onMutateResult, context);
    },
  });
}
