"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/lib/api/dashboard";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardStatsResponse } from "@/lib/types";

type UseFetchDashboardOptions = Omit<
  UseQueryOptions<DashboardStatsResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchDashboard(options?: UseFetchDashboardOptions) {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: fetchDashboardStats,
    ...options,
  });
}
