"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteChallenge } from "@/lib/api/challenges";
import { challengeKeys } from "@/lib/query-keys";
import type { ChallengeResponse } from "@/lib/types";

type DeleteChallengeInput = Parameters<typeof deleteChallenge>[0];

type UseDeleteChallengeOptions = Omit<
  UseMutationOptions<void, Error, DeleteChallengeInput>,
  "mutationFn"
>;

export function useDeleteChallenge(options?: UseDeleteChallengeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteChallenge,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<ChallengeResponse[]>(
        challengeKeys.list(variables.projectId, variables.featureId),
        (current) =>
          current?.filter(
            (challenge) => challenge._id !== variables.challengeId,
          ),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
