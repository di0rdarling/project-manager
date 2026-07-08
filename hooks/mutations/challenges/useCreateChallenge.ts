"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createChallenge } from "@/lib/api/challenges";
import { challengeKeys } from "@/lib/query-keys";
import type { ChallengeResponse } from "@/lib/types";

type CreateChallengeInput = Parameters<typeof createChallenge>[0];

type UseCreateChallengeOptions = Omit<
  UseMutationOptions<ChallengeResponse, Error, CreateChallengeInput>,
  "mutationFn"
>;

export function useCreateChallenge(options?: UseCreateChallengeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createChallenge,
    ...restOptions,
    onSuccess: (challenge, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChallengeResponse[]>(
        challengeKeys.list(variables.projectId, challenge.featureId),
        (current) => (current ? [challenge, ...current] : [challenge]),
      );
      onSuccess?.(challenge, variables, onMutateResult, context);
    },
  });
}
