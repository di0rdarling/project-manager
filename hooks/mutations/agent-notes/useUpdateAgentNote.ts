"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateAgentNote } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";

type UpdateAgentNoteInput = Parameters<typeof updateAgentNote>[0];

type UseUpdateAgentNoteOptions = Omit<
  UseMutationOptions<AgentNoteResponse, Error, UpdateAgentNoteInput>,
  "mutationFn"
>;

export function useUpdateAgentNote(options?: UseUpdateAgentNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateAgentNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        agentNoteKeys.detail(variables.teammateId, note._id),
        note,
      );
      queryClient.setQueryData<AgentNoteResponse[]>(
        agentNoteKeys.list(variables.teammateId),
        (current) =>
          current?.map((existing) =>
            existing._id === note._id ? note : existing,
          ),
      );
      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
