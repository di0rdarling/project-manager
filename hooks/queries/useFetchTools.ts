"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchTools } from "@/lib/api/tools";
import { toolKeys } from "@/lib/query-keys";
import type { ToolResponse } from "@/lib/types";

type UseFetchToolsOptions = Omit<
  UseQueryOptions<ToolResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchTools(
  projectId: string,
  options?: UseFetchToolsOptions,
) {
  return useQuery({
    queryKey: toolKeys.all(projectId),
    queryFn: () => fetchTools(projectId),
    ...options,
  });
}
