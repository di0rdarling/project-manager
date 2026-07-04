"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateRequirement } from "@/lib/api/requirements";
import { requirementKeys } from "@/lib/query-keys";
import type { RequirementResponse } from "@/lib/types";

type UpdateRequirementInput = Parameters<typeof updateRequirement>[0];

type UseUpdateRequirementOptions = Omit<
  UseMutationOptions<RequirementResponse, Error, UpdateRequirementInput>,
  "mutationFn"
>;

export function useUpdateRequirement(options?: UseUpdateRequirementOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateRequirement,
    ...restOptions,
    onSuccess: (requirement, variables, onMutateResult, context) => {
      queryClient.setQueryData<RequirementResponse[]>(
        requirementKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === requirement._id ? requirement : existing,
          ),
      );
      onSuccess?.(requirement, variables, onMutateResult, context);
    },
  });
}
