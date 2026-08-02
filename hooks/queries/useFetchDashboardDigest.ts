"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDashboardDigest } from "@/lib/api/dashboard";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardDigestResponse } from "@/lib/types";

type UseFetchDashboardDigestOptions = Omit<
  UseQueryOptions<DashboardDigestResponse | null, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchDashboardDigest(
  options?: UseFetchDashboardDigestOptions,
) {
  return useQuery({
    queryKey: dashboardKeys.digest,
    queryFn: fetchDashboardDigest,
    ...options,
  });
}
