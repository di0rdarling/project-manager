"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteFeature } from "@/lib/api/features";
import { featureKeys } from "@/lib/query-keys";
import type { FeatureResponse } from "@/lib/types";

type DeleteFeatureInput = Parameters<typeof deleteFeature>[0];

type UseDeleteFeatureOptions = Omit<
  UseMutationOptions<void, Error, DeleteFeatureInput>,
  "mutationFn"
>;

export function useDeleteFeature(options?: UseDeleteFeatureOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteFeature,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<FeatureResponse[]>(
        featureKeys.all(variables.projectId),
        (current) =>
          current?.filter((feature) => feature._id !== variables.featureId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
