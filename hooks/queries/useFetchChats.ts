"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchChats } from "@/lib/api/chats";
import { chatKeys } from "@/lib/query-keys";
import type { ChatResponse } from "@/lib/types";

type UseFetchChatsOptions = Omit<
  UseQueryOptions<ChatResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchChats(options?: UseFetchChatsOptions) {
  return useQuery({
    queryKey: chatKeys.all,
    queryFn: fetchChats,
    ...options,
  });
}
