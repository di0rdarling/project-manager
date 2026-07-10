"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateCurrentUser } from "@/lib/api/auth";
import { currentUserKeys } from "@/lib/query-keys";
import type { UserResponse } from "@/lib/types";

type UpdateCurrentUserInput = Parameters<typeof updateCurrentUser>[0];

type UseUpdateCurrentUserOptions = Omit<
  UseMutationOptions<UserResponse, Error, UpdateCurrentUserInput>,
  "mutationFn"
>;

export function useUpdateCurrentUser(options?: UseUpdateCurrentUserOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateCurrentUser,
    ...restOptions,
    onSuccess: (user, variables, onMutateResult, context) => {
      queryClient.setQueryData(currentUserKeys.detail, user);
      onSuccess?.(user, variables, onMutateResult, context);
    },
  });
}
