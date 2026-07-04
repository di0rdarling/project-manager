"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createChat } from "@/lib/api/chats";
import { chatKeys } from "@/lib/query-keys";
import type { ChatResponse } from "@/lib/types";

type UseCreateChatOptions = Omit<
  UseMutationOptions<ChatResponse, Error, void>,
  "mutationFn"
>;

export function useCreateChat(options?: UseCreateChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createChat,
    ...restOptions,
    onSuccess: (chat, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChatResponse[]>(chatKeys.all, (current) =>
        current ? [chat, ...current] : [chat],
      );
      onSuccess?.(chat, variables, onMutateResult, context);
    },
  });
}
