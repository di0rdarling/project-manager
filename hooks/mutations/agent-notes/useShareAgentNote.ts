"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { shareAgentNote } from "@/lib/api/agent-notes";
import { agentNoteKeys } from "@/lib/query-keys";
import type { AgentNoteResponse } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

type ShareAgentNoteInput = Parameters<typeof shareAgentNote>[0] & {
  previousSharedWithTeammateIds?: ChatTeammateId[];
};

type UseShareAgentNoteOptions = Omit<
  UseMutationOptions<AgentNoteResponse, Error, ShareAgentNoteInput>,
  "mutationFn"
>;

export function useShareAgentNote(options?: UseShareAgentNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: shareAgentNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData<AgentNoteResponse[]>(
        agentNoteKeys.list(variables.teammateId),
        (current) =>
          current?.map((existing) =>
            existing._id === note._id ? note : existing,
          ),
      );

      const affectedTeammateIds = new Set<ChatTeammateId>([
        variables.teammateId,
        ...note.sharedWithTeammateIds,
        ...(variables.previousSharedWithTeammateIds ?? []),
      ]);

      for (const teammateId of affectedTeammateIds) {
        queryClient.invalidateQueries({
          queryKey: agentNoteKeys.list(teammateId),
        });
      }

      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
