"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createPainPoint } from "@/lib/api/pain-points";
import { painPointKeys } from "@/lib/query-keys";
import type { PainPointResponse } from "@/lib/types";

type CreatePainPointInput = Parameters<typeof createPainPoint>[0];

type UseCreatePainPointOptions = Omit<
  UseMutationOptions<PainPointResponse, Error, CreatePainPointInput>,
  "mutationFn"
>;

export function useCreatePainPoint(options?: UseCreatePainPointOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createPainPoint,
    ...restOptions,
    onSuccess: (painPoint, variables, onMutateResult, context) => {
      queryClient.setQueryData<PainPointResponse[]>(
        painPointKeys.all(variables.projectId),
        (current) => (current ? [painPoint, ...current] : [painPoint]),
      );
      onSuccess?.(painPoint, variables, onMutateResult, context);
    },
  });
}
