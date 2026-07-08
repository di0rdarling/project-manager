"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { generateAgentMemory } from "@/lib/api/agent-memory";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import { agentMemoryKeys } from "@/lib/query-keys";
import type { AgentMemoryResponse } from "@/lib/types";

type UseGenerateAgentMemoryOptions = Omit<
  UseMutationOptions<AgentMemoryResponse, Error, ChatTeammateId>,
  "mutationFn"
>;

export function useGenerateAgentMemory(
  options?: UseGenerateAgentMemoryOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: generateAgentMemory,
    ...restOptions,
    onSuccess: (memory, teammateId, onMutateResult, context) => {
      queryClient.setQueryData(agentMemoryKeys.detail(teammateId), memory);
      onSuccess?.(memory, teammateId, onMutateResult, context);
    },
  });
}
