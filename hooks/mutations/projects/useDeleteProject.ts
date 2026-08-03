"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteProject } from "@/lib/api/projects";
import { accountUsageKeys, projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UseDeleteProjectOptions = Omit<
  UseMutationOptions<void, Error, string>,
  "mutationFn"
>;

export function useDeleteProject(options?: UseDeleteProjectOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteProject,
    ...restOptions,
    onSuccess: (data, projectId, onMutateResult, context) => {
      queryClient.setQueryData<ProjectResponse[]>(projectKeys.all, (current) =>
        current?.filter((project) => project._id !== projectId),
      );
      queryClient.invalidateQueries({ queryKey: accountUsageKeys.detail });
      onSuccess?.(data, projectId, onMutateResult, context);
    },
  });
}
