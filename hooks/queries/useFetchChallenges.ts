"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchChallenges } from "@/lib/api/challenges";
import { challengeKeys } from "@/lib/query-keys";
import type { ChallengeResponse } from "@/lib/types";

type UseFetchChallengesOptions = Omit<
  UseQueryOptions<ChallengeResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchChallenges(
  projectId: string,
  options?: UseFetchChallengesOptions,
) {
  return useQuery({
    queryKey: challengeKeys.all(projectId),
    queryFn: () => fetchChallenges(projectId),
    ...options,
  });
}
