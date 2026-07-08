"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateChallenge } from "@/lib/api/challenges";
import { challengeKeys } from "@/lib/query-keys";
import type { ChallengeResponse } from "@/lib/types";

type UpdateChallengeInput = Parameters<typeof updateChallenge>[0];

type UseUpdateChallengeOptions = Omit<
  UseMutationOptions<ChallengeResponse, Error, UpdateChallengeInput>,
  "mutationFn"
>;

export function useUpdateChallenge(options?: UseUpdateChallengeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateChallenge,
    ...restOptions,
    onSuccess: (challenge, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChallengeResponse[]>(
        challengeKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === challenge._id ? challenge : existing,
          ),
      );
      onSuccess?.(challenge, variables, onMutateResult, context);
    },
  });
}
