"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchFeatures } from "@/lib/api/features";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type UseFetchFeaturesOptions = Omit<
  UseQueryOptions<FeatureResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchFeatures(
  projectId: string,
  options?: UseFetchFeaturesOptions,
) {
  return useQuery({
    queryKey: featureKeys.all(projectId),
    queryFn: () => fetchFeatures(projectId),
    ...options,
  });
}
