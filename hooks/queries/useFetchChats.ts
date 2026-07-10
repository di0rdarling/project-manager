"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchChats, type ChatListStatus } from "@/lib/api/chats";
import { chatKeys } from "@/lib/query-keys";
import type { ChatListItemResponse } from "@/lib/types";

type UseFetchChatsOptions = Omit<
  UseQueryOptions<ChatListItemResponse[], Error>,
  "queryKey" | "queryFn"
> & {
  status?: ChatListStatus;
};

export function useFetchChats(options?: UseFetchChatsOptions) {
  const { status = "active", ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: chatKeys.list(status),
    queryFn: () => fetchChats(status),
    ...queryOptions,
  });
}
