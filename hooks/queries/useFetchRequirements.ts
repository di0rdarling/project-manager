"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchRequirements } from "@/lib/api/requirements";
import { requirementKeys } from "@/lib/query-keys";
import type { RequirementResponse } from "@/lib/types";

type UseFetchRequirementsOptions = Omit<
  UseQueryOptions<RequirementResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchRequirements(
  projectId: string,
  options?: UseFetchRequirementsOptions,
) {
  return useQuery({
    queryKey: requirementKeys.all(projectId),
    queryFn: () => fetchRequirements(projectId),
    ...options,
  });
}
