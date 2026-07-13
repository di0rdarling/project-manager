"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentNote } from "@/lib/api/agent-notes";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";

type UseFetchAgentNoteOptions = Omit<
  UseQueryOptions<AgentNoteResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentNote(
  teammateId: ChatTeammateId,
  noteId: string,
  options?: UseFetchAgentNoteOptions,
) {
  return useQuery({
    queryKey: agentNoteKeys.detail(teammateId, noteId),
    queryFn: () => fetchAgentNote({ teammateId, noteId }),
    ...options,
  });
}
