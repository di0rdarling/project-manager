"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deletePainPoint } from "@/lib/api/pain-points";
import { painPointKeys } from "@/lib/query-keys";
import type { PainPointResponse } from "@/lib/types";

type DeletePainPointInput = Parameters<typeof deletePainPoint>[0];

type UseDeletePainPointOptions = Omit<
  UseMutationOptions<void, Error, DeletePainPointInput>,
  "mutationFn"
>;

export function useDeletePainPoint(options?: UseDeletePainPointOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deletePainPoint,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<PainPointResponse[]>(
        painPointKeys.all(variables.projectId),
        (current) =>
          current?.filter((painPoint) => painPoint._id !== variables.painPointId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
