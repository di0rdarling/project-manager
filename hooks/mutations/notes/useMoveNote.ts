"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { moveNote } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type MoveNoteInput = Parameters<typeof moveNote>[0];

type UseMoveNoteOptions = Omit<
  UseMutationOptions<NoteResponse, Error, MoveNoteInput>,
  "mutationFn"
>;

export function useMoveNote(options?: UseMoveNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: moveNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteResponse[]>(
        noteKeys.list(variables.projectId, note.featureId),
        (current) =>
          current?.map((existing) =>
            existing._id === note._id ? note : existing,
          ),
      );
      queryClient.setQueryData(
        noteKeys.detail(variables.projectId, note._id),
        note,
      );
      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
