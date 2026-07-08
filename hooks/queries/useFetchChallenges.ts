"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchChallenges } from "@/lib/api/challenges";
import { challengeKeys } from "@/lib/query-keys";
import type { ChallengeResponse } from "@/lib/types";

type UseFetchChallengesOptions = Omit<
  UseQueryOptions<ChallengeResponse[], Error>,
  "queryKey" | "queryFn"
> & {
  featureId?: string | null;
};

export function useFetchChallenges(
  projectId: string,
  options?: UseFetchChallengesOptions,
) {
  const { featureId, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: challengeKeys.list(projectId, featureId),
    queryFn: () => fetchChallenges(projectId, featureId),
    ...queryOptions,
  });
}
