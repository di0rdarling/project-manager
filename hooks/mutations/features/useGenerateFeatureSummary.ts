"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { generateFeatureSummary } from "@/lib/api/feature-summary";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type FeatureSummaryInput = {
  projectId: string;
  featureId: string;
};

type UseGenerateFeatureSummaryOptions = Omit<
  UseMutationOptions<FeatureResponse, Error, FeatureSummaryInput>,
  "mutationFn"
>;

export function useGenerateFeatureSummary(
  options?: UseGenerateFeatureSummaryOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: generateFeatureSummary,
    ...restOptions,
    onSuccess: (feature, input, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: featureKeys.detail(input.projectId, input.featureId),
      });
      queryClient.invalidateQueries({
        queryKey: featureKeys.all(input.projectId),
      });
      onSuccess?.(feature, input, onMutateResult, context);
    },
  });
}
