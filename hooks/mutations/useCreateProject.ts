"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createProject } from "@/lib/api/projects";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type CreateProjectInput = Parameters<typeof createProject>[0];

type UseCreateProjectOptions = Omit<
  UseMutationOptions<ProjectResponse, Error, CreateProjectInput>,
  "mutationFn"
>;

export function useCreateProject(options?: UseCreateProjectOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createProject,
    ...restOptions,
    onSuccess: (project, variables, onMutateResult, context) => {
      queryClient.setQueryData<ProjectResponse[]>(projectKeys.all, (current) =>
        current ? [project, ...current] : [project],
      );
      onSuccess?.(project, variables, onMutateResult, context);
    },
  });
}
