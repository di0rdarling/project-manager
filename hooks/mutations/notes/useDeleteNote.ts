"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteNote } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type DeleteNoteInput = Parameters<typeof deleteNote>[0];

type UseDeleteNoteOptions = Omit<
  UseMutationOptions<void, Error, DeleteNoteInput>,
  "mutationFn"
>;

export function useDeleteNote(options?: UseDeleteNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteNote,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteResponse[]>(
        noteKeys.all(variables.projectId),
        (current) =>
          current?.filter((note) => note._id !== variables.noteId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
