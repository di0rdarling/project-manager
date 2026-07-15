"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchUserMemory } from "@/lib/api/user-memory";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { userMemoryKeys } from "@/lib/query-keys";
import type { UserMemoryResponse } from "@/lib/types";

type UseFetchUserMemoryOptions = Omit<
  UseQueryOptions<UserMemoryResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchUserMemory(
  teammateId: ChatTeammateId,
  options?: UseFetchUserMemoryOptions,
) {
  return useQuery({
    queryKey: userMemoryKeys.detail(teammateId),
    queryFn: () => fetchUserMemory(teammateId),
    ...options,
  });
}
