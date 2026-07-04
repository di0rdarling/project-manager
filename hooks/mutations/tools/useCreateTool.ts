"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createTool } from "@/lib/api/tools";
import { toolKeys } from "@/lib/query-keys";
import type { ToolResponse } from "@/lib/types";

type CreateToolInput = Parameters<typeof createTool>[0];

type UseCreateToolOptions = Omit<
  UseMutationOptions<ToolResponse, Error, CreateToolInput>,
  "mutationFn"
>;

export function useCreateTool(options?: UseCreateToolOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createTool,
    ...restOptions,
    onSuccess: (tool, variables, onMutateResult, context) => {
      queryClient.setQueryData<ToolResponse[]>(
        toolKeys.all(variables.projectId),
        (current) => (current ? [tool, ...current] : [tool]),
      );
      onSuccess?.(tool, variables, onMutateResult, context);
    },
  });
}
