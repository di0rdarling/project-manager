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

export function updateAllChatListCaches(
  queryClient: QueryClient,
  updater: (
    current: ChatListItemResponse[] | undefined,
  ) => ChatListItemResponse[] | undefined,
): void {
  queryClient.setQueriesData<ChatListItemResponse[]>(
    { queryKey: chatKeys.all },
    updater,
  );
}
