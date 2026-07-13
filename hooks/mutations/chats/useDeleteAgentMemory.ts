"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteAgentMemory } from "@/lib/api/agent-memory";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentMemoryKeys } from "@/lib/query-keys";
import type { AgentMemoryResponse } from "@/lib/types";

type UseDeleteAgentMemoryOptions = Omit<
  UseMutationOptions<AgentMemoryResponse, Error, ChatTeammateId>,
  "mutationFn"
>;

export function useDeleteAgentMemory(options?: UseDeleteAgentMemoryOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteAgentMemory,
    ...restOptions,
    onSuccess: (memory, teammateId, onMutateResult, context) => {
      queryClient.setQueryData(agentMemoryKeys.detail(teammateId), memory);
      onSuccess?.(memory, teammateId, onMutateResult, context);
    },
  });
}
