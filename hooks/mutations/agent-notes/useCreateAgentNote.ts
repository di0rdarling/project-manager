"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createAgentNote } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";

type CreateAgentNoteInput = Parameters<typeof createAgentNote>[0];

type UseCreateAgentNoteOptions = Omit<
  UseMutationOptions<AgentNoteResponse, Error, CreateAgentNoteInput>,
  "mutationFn"
>;

export function useCreateAgentNote(options?: UseCreateAgentNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createAgentNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentNoteResponse[]>(
        agentNoteKeys.list(variables.teammateId),
        (current) => (current ? [note, ...current] : [note]),
      );
      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
