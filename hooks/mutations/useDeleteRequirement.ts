"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteRequirement } from "@/lib/api/requirements";
import { requirementKeys } from "@/lib/query-keys";
import type { RequirementResponse } from "@/lib/types";

type DeleteRequirementInput = Parameters<typeof deleteRequirement>[0];

type UseDeleteRequirementOptions = Omit<
  UseMutationOptions<void, Error, DeleteRequirementInput>,
  "mutationFn"
>;

export function useDeleteRequirement(options?: UseDeleteRequirementOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteRequirement,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<RequirementResponse[]>(
        requirementKeys.all(variables.projectId),
        (current) =>
          current?.filter(
            (requirement) => requirement._id !== variables.requirementId,
          ),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
