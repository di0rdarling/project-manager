"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchProject } from "@/lib/api/projects";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UseFetchProjectOptions = Omit<
  UseQueryOptions<ProjectResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchProject(
  projectId: string,
  options?: UseFetchProjectOptions,
) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    ...options,
  });
}
