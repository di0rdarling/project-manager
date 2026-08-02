"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDocumentReviewChat } from "@/lib/api/agent-document-review-chat";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentDocumentKeys } from "@/lib/query-keys";
import type { AgentDocumentReviewChatResponse } from "@/lib/types";

type UseFetchDocumentReviewChatOptions = Omit<
  UseQueryOptions<AgentDocumentReviewChatResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchDocumentReviewChat(
  teammateId: ChatTeammateId,
  documentId: string,
  options?: UseFetchDocumentReviewChatOptions,
) {
  return useQuery({
    queryKey: agentDocumentKeys.reviewChat(teammateId, documentId),
    queryFn: () => fetchDocumentReviewChat({ teammateId, documentId }),
    ...options,
  });
}
