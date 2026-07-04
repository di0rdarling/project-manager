"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateTool } from "@/lib/api/tools";
import { toolKeys } from "@/lib/query-keys";
import type { ToolResponse } from "@/lib/types";

type UpdateToolInput = Parameters<typeof updateTool>[0];

type UseUpdateToolOptions = Omit<
  UseMutationOptions<ToolResponse, Error, UpdateToolInput>,
  "mutationFn"
>;

export function useUpdateTool(options?: UseUpdateToolOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateTool,
    ...restOptions,
    onSuccess: (tool, variables, onMutateResult, context) => {
      queryClient.setQueryData<ToolResponse[]>(
        toolKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === tool._id ? tool : existing,
          ),
      );
      onSuccess?.(tool, variables, onMutateResult, context);
    },
  });
}
