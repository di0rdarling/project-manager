"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateNote } from "@/lib/api/notes";
import { noteKeys } from "@/lib/query-keys";
import type { NoteResponse } from "@/lib/types";

type UpdateNoteInput = Parameters<typeof updateNote>[0];

type UseUpdateNoteOptions = Omit<
  UseMutationOptions<NoteResponse, Error, UpdateNoteInput>,
  "mutationFn"
>;

export function useUpdateNote(options?: UseUpdateNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateNote,
    ...restOptions,
    onSuccess: (note, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteResponse[]>(
        noteKeys.list(variables.projectId, note.featureId),
        (current) =>
          current?.map((existing) =>
            existing._id === note._id ? note : existing,
          ),
      );
      onSuccess?.(note, variables, onMutateResult, context);
    },
  });
}
