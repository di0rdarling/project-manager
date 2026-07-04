"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateProject } from "@/lib/api/projects";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UpdateProjectInput = Parameters<typeof updateProject>[0];

type UseUpdateProjectOptions = Omit<
  UseMutationOptions<ProjectResponse, Error, UpdateProjectInput>,
  "mutationFn"
>;

export function useUpdateProject(options?: UseUpdateProjectOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateProject,
    ...restOptions,
    onSuccess: (project, variables, onMutateResult, context) => {
      queryClient.setQueryData<ProjectResponse[]>(projectKeys.all, (current) =>
        current?.map((existing) =>
          existing._id === project._id ? project : existing,
        ),
      );
      queryClient.setQueryData(projectKeys.detail(project._id), project);
      onSuccess?.(project, variables, onMutateResult, context);
    },
  });
}
