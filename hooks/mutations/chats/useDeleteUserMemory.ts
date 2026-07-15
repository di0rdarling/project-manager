"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteUserMemory } from "@/lib/api/user-memory";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { userMemoryKeys } from "@/lib/query-keys";
import type { UserMemoryResponse } from "@/lib/types";

type UseDeleteUserMemoryOptions = Omit<
  UseMutationOptions<UserMemoryResponse, Error, ChatTeammateId>,
  "mutationFn"
>;

export function useDeleteUserMemory(options?: UseDeleteUserMemoryOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteUserMemory,
    ...restOptions,
    onSuccess: (memory, teammateId, onMutateResult, context) => {
      queryClient.setQueryData(userMemoryKeys.detail(teammateId), memory);
      onSuccess?.(memory, teammateId, onMutateResult, context);
    },
  });
}
