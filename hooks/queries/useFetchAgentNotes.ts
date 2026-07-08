"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchAgentNotes } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";

type UseFetchAgentNotesOptions = Omit<
  UseQueryOptions<AgentNoteResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAgentNotes(
  teammateId: string,
  options?: UseFetchAgentNotesOptions,
) {
  return useQuery({
    queryKey: agentNoteKeys.list(teammateId),
    queryFn: () => fetchAgentNotes(teammateId),
    ...options,
  });
}
