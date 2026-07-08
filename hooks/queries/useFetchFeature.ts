"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchFeature } from "@/lib/api/features";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type UseFetchFeatureOptions = Omit<
  UseQueryOptions<FeatureResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchFeature(
  projectId: string,
  featureId: string,
  options?: UseFetchFeatureOptions,
) {
  return useQuery({
    queryKey: featureKeys.detail(projectId, featureId),
    queryFn: () => fetchFeature({ projectId, featureId }),
    ...options,
  });
}
