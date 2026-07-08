"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createFeature } from "@/lib/api/features";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type CreateFeatureInput = Parameters<typeof createFeature>[0];

type UseCreateFeatureOptions = Omit<
  UseMutationOptions<FeatureResponse, Error, CreateFeatureInput>,
  "mutationFn"
>;

export function useCreateFeature(options?: UseCreateFeatureOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createFeature,
    ...restOptions,
    onSuccess: (feature, variables, onMutateResult, context) => {
      queryClient.setQueryData<FeatureResponse[]>(
        featureKeys.all(variables.projectId),
        (current) => (current ? [feature, ...current] : [feature]),
      );
      onSuccess?.(feature, variables, onMutateResult, context);
    },
  });
}
