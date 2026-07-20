"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteNoteFolder } from "@/lib/api/note-folders";
import { noteFolderKeys, noteKeys } from "@/lib/query-keys";
import type { NoteFolderResponse } from "@/lib/types";

type DeleteNoteFolderInput = Parameters<typeof deleteNoteFolder>[0];

type UseDeleteNoteFolderOptions = Omit<
  UseMutationOptions<void, Error, DeleteNoteFolderInput>,
  "mutationFn"
>;

export function useDeleteNoteFolder(options?: UseDeleteNoteFolderOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteNoteFolder,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<NoteFolderResponse[]>(
        noteFolderKeys.list(variables.projectId),
        (current) =>
          current?.filter((folder) => folder._id !== variables.folderId),
      );
      void queryClient.invalidateQueries({
        queryKey: noteKeys.list(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: noteFolderKeys.list(variables.projectId),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
