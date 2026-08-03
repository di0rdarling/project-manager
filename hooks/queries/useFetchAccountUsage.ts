"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AccountUsageResponse } from "@/lib/account/account-usage";
import { fetchAccountUsage } from "@/lib/api/account";
import { accountUsageKeys } from "@/lib/query-keys";

type UseFetchAccountUsageOptions = Omit<
  UseQueryOptions<AccountUsageResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useFetchAccountUsage(options?: UseFetchAccountUsageOptions) {
  return useQuery({
    queryKey: accountUsageKeys.detail,
    queryFn: fetchAccountUsage,
    ...options,
  });
}
