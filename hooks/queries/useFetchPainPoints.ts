"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchPainPoints } from "@/lib/api/pain-points";
import { painPointKeys } from "@/lib/query-keys";
import type { PainPointResponse } from "@/lib/types";

type UseFetchPainPointsOptions = Omit<
  UseQueryOptions<PainPointResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchPainPoints(
  projectId: string,
  options?: UseFetchPainPointsOptions,
) {
  return useQuery({
    queryKey: painPointKeys.all(projectId),
    queryFn: () => fetchPainPoints(projectId),
    ...options,
  });
}
