"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createNoteFolder } from "@/lib/api/note-folders";
import { noteFolderKeys } from "@/lib/query-keys";
import type { NoteFolderResponse } from "@/lib/types";

type CreateNoteFolderInput = Parameters<typeof createNoteFolder>[0];

type UseCreateNoteFolderOptions = Omit<
  UseMutationOptions<NoteFolderResponse, Error, CreateNoteFolderInput>,
  "mutationFn"
>;

export function useCreateNoteFolder(options?: UseCreateNoteFolderOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createNoteFolder,
    ...restOptions,
    onSuccess: (folder, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteFolderResponse[]>(
        noteFolderKeys.list(variables.projectId),
        (current) => (current ? [...current, folder] : [folder]),
      );
      onSuccess?.(folder, variables, onMutateResult, context);
    },
  });
}
