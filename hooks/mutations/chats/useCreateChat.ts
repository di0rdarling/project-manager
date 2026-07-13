"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createChat } from "@/lib/api/chats";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { chatKeys } from "@/lib/query-keys";
import type { ChatListItemResponse } from "@/lib/types";

type UseCreateChatOptions = Omit<
  UseMutationOptions<
    ChatListItemResponse,
    Error,
    {
      projectId: string;
      teammateId: ChatTeammateId;
      requirementId?: string | null;
      featureId?: string | null;
      modelId?: ChatModelId;
    }
  >,
  "mutationFn"
>;

export function useCreateChat(options?: UseCreateChatOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createChat,
    ...restOptions,
    onSuccess: (chat, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChatListItemResponse[]>(
        chatKeys.list("active"),
        (current) => (current ? [chat, ...current] : [chat]),
      );
      onSuccess?.(chat, variables, onMutateResult, context);
    },
  });
}
