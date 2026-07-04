"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { generateProjectSummary } from "@/lib/api/summary";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UseGenerateProjectSummaryOptions = Omit<
  UseMutationOptions<ProjectResponse, Error, string>,
  "mutationFn"
>;

export function useGenerateProjectSummary(
  options?: UseGenerateProjectSummaryOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: generateProjectSummary,
    ...restOptions,
    onSuccess: (project, projectId, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.(project, projectId, onMutateResult, context);
    },
  });
}
