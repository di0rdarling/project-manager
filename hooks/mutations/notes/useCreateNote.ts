"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createNote } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type CreateNoteInput = Parameters<typeof createNote>[0];

type UseCreateNoteOptions = Omit<
  UseMutationOptions<NoteResponse, Error, CreateNoteInput>,
  "mutationFn"
>;

export function useCreateNote(options?: UseCreateNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteResponse[]>(
        noteKeys.list(variables.projectId, note.featureId),
        (current) => (current ? [note, ...current] : [note]),
      );
      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
