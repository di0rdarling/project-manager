"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteCoreUser } from "@/lib/api/core-users";
import { coreUserKeys } from "@/lib/query-keys";
import type { CoreUserResponse } from "@/lib/types";

type DeleteCoreUserInput = Parameters<typeof deleteCoreUser>[0];

type UseDeleteCoreUserOptions = Omit<
  UseMutationOptions<void, Error, DeleteCoreUserInput>,
  "mutationFn"
>;

export function useDeleteCoreUser(options?: UseDeleteCoreUserOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteCoreUser,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<CoreUserResponse[]>(
        coreUserKeys.all(variables.projectId),
        (current) =>
          current?.filter((coreUser) => coreUser._id !== variables.coreUserId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
