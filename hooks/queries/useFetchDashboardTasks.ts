"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardTasksResponse } from "@/lib/types";

async function fetchDashboardTasks(): Promise<DashboardTasksResponse> {
  const response = await fetch("/api/dashboard/tasks");
  const data = (await response.json()) as DashboardTasksResponse & {
    error?: string;
  };
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to fetch tasks");
  }
  return data;
}

type UseFetchDashboardTasksOptions = Omit<
  UseQueryOptions<DashboardTasksResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchDashboardTasks(
  options?: UseFetchDashboardTasksOptions,
) {
  return useQuery({
    queryKey: dashboardKeys.tasks,
    queryFn: fetchDashboardTasks,
    ...options,
  });
}
