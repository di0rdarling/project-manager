"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateCoreUser } from "@/lib/api/core-users";
import { coreUserKeys } from "@/lib/query-keys";
import type { CoreUserResponse } from "@/lib/types";

type UpdateCoreUserInput = Parameters<typeof updateCoreUser>[0];

type UseUpdateCoreUserOptions = Omit<
  UseMutationOptions<CoreUserResponse, Error, UpdateCoreUserInput>,
  "mutationFn"
>;

export function useUpdateCoreUser(options?: UseUpdateCoreUserOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateCoreUser,
    ...restOptions,
    onSuccess: (coreUser, variables, onMutateResult, context) => {
      queryClient.setQueryData<CoreUserResponse[]>(
        coreUserKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === coreUser._id ? coreUser : existing,
          ),
      );
      onSuccess?.(coreUser, variables, onMutateResult, context);
    },
  });
}
