"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateFeature } from "@/lib/api/features";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type UpdateFeatureInput = Parameters<typeof updateFeature>[0];

type UseUpdateFeatureOptions = Omit<
  UseMutationOptions<FeatureResponse, Error, UpdateFeatureInput>,
  "mutationFn"
>;

export function useUpdateFeature(options?: UseUpdateFeatureOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateFeature,
    ...restOptions,
    onSuccess: (feature, variables, onMutateResult, context) => {
      queryClient.setQueryData<FeatureResponse[]>(
        featureKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === feature._id ? feature : existing,
          ),
      );
      onSuccess?.(feature, variables, onMutateResult, context);
    },
  });
}
