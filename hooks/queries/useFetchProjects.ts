"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchProjects } from "@/lib/api/projects";
import { projectKeys } from "@/lib/query-keys";
import type { ProjectResponse } from "@/lib/types";

type UseFetchProjectsOptions = Omit<
  UseQueryOptions<ProjectResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchProjects(options?: UseFetchProjectsOptions) {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
    ...options,
  });
}
