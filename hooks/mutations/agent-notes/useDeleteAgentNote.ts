"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteAgentNote } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";

type DeleteAgentNoteInput = Parameters<typeof deleteAgentNote>[0];

type UseDeleteAgentNoteOptions = Omit<
  UseMutationOptions<void, Error, DeleteAgentNoteInput>,
  "mutationFn"
>;

export function useDeleteAgentNote(options?: UseDeleteAgentNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteAgentNote,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentNoteResponse[]>(
        agentNoteKeys.list(variables.teammateId),
        (current) =>
          current?.filter((note) => note._id !== variables.noteId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
