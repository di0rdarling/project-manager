"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentMemory } from "@/lib/api/agent-memory";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import { agentMemoryKeys } from "@/lib/query-keys";
import type { AgentMemoryResponse } from "@/lib/types";

type UseFetchAgentMemoryOptions = Omit<
  UseQueryOptions<AgentMemoryResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentMemory(
  teammateId: ChatTeammateId,
  options?: UseFetchAgentMemoryOptions,
) {
  return useQuery({
    queryKey: agentMemoryKeys.detail(teammateId),
    queryFn: () => fetchAgentMemory(teammateId),
    ...options,
  });
}
