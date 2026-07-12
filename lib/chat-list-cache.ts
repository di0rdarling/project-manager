import type { QueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/query-keys";
import type { ChatListItemResponse, ChatResponse } from "@/lib/types";

/**
 * Merges an updated chat payload into a list item while preserving
 * display context (project, requirement, feature) that list APIs attach.
 */
export function mergeChatListItem(
  existing: ChatListItemResponse | undefined,
  updated: ChatResponse,
): ChatListItemResponse {
  return {
    ...updated,
    project: existing?.project ?? null,
    requirement: existing?.requirement ?? null,
    feature: existing?.feature ?? null,
  };
}

const CHAT_LIST_STATUSES = ["active", "archived", "all"] as const;

export function updateAllChatListCaches(
  queryClient: QueryClient,
  updater: (
    current: ChatListItemResponse[] | undefined,
  ) => ChatListItemResponse[] | undefined,
): void {
  for (const status of CHAT_LIST_STATUSES) {
    queryClient.setQueryData<ChatListItemResponse[]>(
      chatKeys.list(status),
      updater,
    );
  }
}
