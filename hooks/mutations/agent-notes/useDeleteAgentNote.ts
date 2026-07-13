"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteAgentNote } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

type DeleteAgentNoteInput = Parameters<typeof deleteAgentNote>[0] & {
  sharedWithTeammateIds?: ChatTeammateId[];
};

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

      const affectedTeammateIds = new Set<ChatTeammateId>([
        variables.teammateId,
        ...(variables.sharedWithTeammateIds ?? []),
      ]);

      for (const teammateId of affectedTeammateIds) {
        queryClient.invalidateQueries({
          queryKey: agentNoteKeys.list(teammateId),
        });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
