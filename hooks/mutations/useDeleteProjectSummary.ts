"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteProjectSummary } from "@/lib/api/summary";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UseDeleteProjectSummaryOptions = Omit<
  UseMutationOptions<ProjectResponse, Error, string>,
  "mutationFn"
>;

export function useDeleteProjectSummary(
  options?: UseDeleteProjectSummaryOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteProjectSummary,
    ...restOptions,
    onSuccess: (project, projectId, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.(project, projectId, onMutateResult, context);
    },
  });
}
