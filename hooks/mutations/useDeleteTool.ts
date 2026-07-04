"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteTool } from "@/lib/api/tools";
import { toolKeys } from "@/lib/query-keys";
import type { ToolResponse } from "@/lib/types";

type DeleteToolInput = Parameters<typeof deleteTool>[0];

type UseDeleteToolOptions = Omit<
  UseMutationOptions<void, Error, DeleteToolInput>,
  "mutationFn"
>;

export function useDeleteTool(options?: UseDeleteToolOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteTool,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<ToolResponse[]>(
        toolKeys.all(variables.projectId),
        (current) =>
          current?.filter((tool) => tool._id !== variables.toolId),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
