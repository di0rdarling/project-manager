"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchCoreUsers } from "@/lib/api/core-users";
import { coreUserKeys } from "@/lib/query-keys";
import type { CoreUserResponse } from "@/lib/types";

type UseFetchCoreUsersOptions = Omit<
  UseQueryOptions<CoreUserResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchCoreUsers(
  projectId: string,
  options?: UseFetchCoreUsersOptions,
) {
  return useQuery({
    queryKey: coreUserKeys.all(projectId),
    queryFn: () => fetchCoreUsers(projectId),
    ...options,
  });
}
