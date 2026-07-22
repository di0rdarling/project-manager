"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentDocument } from "@/lib/api/agent-documents";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentDocumentKeys } from "@/lib/query-keys";
import type { AgentDocumentResponse } from "@/lib/types";

type UseFetchAgentDocumentOptions = Omit<
  UseQueryOptions<AgentDocumentResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentDocument(
  teammateId: ChatTeammateId,
  documentId: string,
  options?: UseFetchAgentDocumentOptions,
) {
  return useQuery({
    queryKey: agentDocumentKeys.detail(teammateId, documentId),
    queryFn: () => fetchAgentDocument({ teammateId, documentId }),
    ...options,
  });
}
