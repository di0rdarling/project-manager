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
