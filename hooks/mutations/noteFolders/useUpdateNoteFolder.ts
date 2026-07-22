"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateNoteFolder } from "@/lib/api/note-folders";
import { noteFolderKeys } from "@/lib/query-keys";
import type { NoteFolderResponse } from "@/lib/types";

type UpdateNoteFolderInput = Parameters<typeof updateNoteFolder>[0];

type UseUpdateNoteFolderOptions = Omit<
  UseMutationOptions<NoteFolderResponse, Error, UpdateNoteFolderInput>,
  "mutationFn"
>;

export function useUpdateNoteFolder(options?: UseUpdateNoteFolderOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateNoteFolder,
    ...restOptions,
    onSuccess: (folder, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteFolderResponse[]>(
        noteFolderKeys.list(variables.projectId, folder.featureId),
        (current) =>
          current?.map((existing) =>
            existing._id === folder._id ? folder : existing,
          ),
      );
      onSuccess?.(folder, variables, onMutateResult, context);
    },
  });
}
