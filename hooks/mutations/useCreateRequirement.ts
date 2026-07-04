"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createRequirement } from "@/lib/api/requirements";
import { requirementKeys } from "@/lib/query-keys";
import type { RequirementResponse } from "@/lib/types";

type CreateRequirementInput = Parameters<typeof createRequirement>[0];

type UseCreateRequirementOptions = Omit<
  UseMutationOptions<RequirementResponse, Error, CreateRequirementInput>,
  "mutationFn"
>;

export function useCreateRequirement(options?: UseCreateRequirementOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createRequirement,
    ...restOptions,
    onSuccess: (requirement, variables, onMutateResult, context) => {
      queryClient.setQueryData<RequirementResponse[]>(
        requirementKeys.all(variables.projectId),
        (current) => (current ? [requirement, ...current] : [requirement]),
      );
      onSuccess?.(requirement, variables, onMutateResult, context);
    },
  });
}
