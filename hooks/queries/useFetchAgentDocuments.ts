"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentDocuments } from "@/lib/api/agent-documents";
import { agentDocumentKeys } from "@/lib/query-keys";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentDocumentResponse } from "@/lib/types";

type UseFetchAgentDocumentsOptions = Omit<
  UseQueryOptions<AgentDocumentResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentDocuments(
  teammateId: ChatTeammateId,
  options?: UseFetchAgentDocumentsOptions,
) {
  return useQuery({
    queryKey: agentDocumentKeys.list(teammateId),
    queryFn: () => fetchAgentDocuments(teammateId),
    ...options,
  });
}
