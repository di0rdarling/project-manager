"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { generateUserMemory } from "@/lib/api/user-memory";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { userMemoryKeys } from "@/lib/query-keys";
import type { UserMemoryResponse } from "@/lib/types";

type UseGenerateUserMemoryOptions = Omit<
  UseMutationOptions<UserMemoryResponse, Error, ChatTeammateId>,
  "mutationFn"
>;

export function useGenerateUserMemory(
  options?: UseGenerateUserMemoryOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: generateUserMemory,
    ...restOptions,
    onSuccess: (memory, teammateId, onMutateResult, context) => {
      queryClient.setQueryData(userMemoryKeys.detail(teammateId), memory);
      onSuccess?.(memory, teammateId, onMutateResult, context);
    },
  });
}
