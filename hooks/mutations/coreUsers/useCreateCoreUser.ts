"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createCoreUser } from "@/lib/api/core-users";
import { coreUserKeys } from "@/lib/query-keys";
import type { CoreUserResponse } from "@/lib/types";

type CreateCoreUserInput = Parameters<typeof createCoreUser>[0];

type UseCreateCoreUserOptions = Omit<
  UseMutationOptions<CoreUserResponse, Error, CreateCoreUserInput>,
  "mutationFn"
>;

export function useCreateCoreUser(options?: UseCreateCoreUserOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createCoreUser,
    ...restOptions,
    onSuccess: (coreUser, variables, onMutateResult, context) => {
      queryClient.setQueryData<CoreUserResponse[]>(
        coreUserKeys.all(variables.projectId),
        (current) => (current ? [coreUser, ...current] : [coreUser]),
      );
      onSuccess?.(coreUser, variables, onMutateResult, context);
    },
  });
}
