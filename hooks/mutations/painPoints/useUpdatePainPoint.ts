"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updatePainPoint } from "@/lib/api/pain-points";
import { painPointKeys } from "@/lib/query-keys";
import type { PainPointResponse } from "@/lib/types";

type UpdatePainPointInput = Parameters<typeof updatePainPoint>[0];

type UseUpdatePainPointOptions = Omit<
  UseMutationOptions<PainPointResponse, Error, UpdatePainPointInput>,
  "mutationFn"
>;

export function useUpdatePainPoint(options?: UseUpdatePainPointOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updatePainPoint,
    ...restOptions,
    onSuccess: (painPoint, variables, onMutateResult, context) => {
      queryClient.setQueryData<PainPointResponse[]>(
        painPointKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === painPoint._id ? painPoint : existing,
          ),
      );
      onSuccess?.(painPoint, variables, onMutateResult, context);
    },
  });
}
