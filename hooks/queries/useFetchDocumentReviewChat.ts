"use client";

import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDocumentReviewChat } from "@/lib/api/agent-document-review-chat";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentDocumentKeys } from "@/lib/query-keys";
import { syncOverviewChatFromReviewChat } from "@/lib/query-cache/sync-task-conversation-cache";
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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: agentDocumentKeys.reviewChat(teammateId, documentId),
    queryFn: async () => {
      const data = await fetchDocumentReviewChat({ teammateId, documentId });
      syncOverviewChatFromReviewChat(
        queryClient,
        teammateId,
        data.taskConversation,
        data,
      );
      return data;
    },
    ...options,
  });
}
