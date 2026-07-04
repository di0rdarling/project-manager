"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchChat } from "@/lib/api/chats";
import { chatKeys } from "@/lib/query-keys";
import type { ChatWithMessagesResponse } from "@/lib/types";

type UseFetchChatOptions = Omit<
  UseQueryOptions<ChatWithMessagesResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchChat(chatId: string, options?: UseFetchChatOptions) {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => fetchChat(chatId),
    ...options,
  });
}
