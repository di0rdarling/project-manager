"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  startAgentTaskOutputRequest,
  type StartAgentTaskOutputRequest,
} from "@/lib/api/agent-tasks";
import { agentTasksKeys } from "@/lib/query-keys";
import type { AgentTasksResponse } from "@/lib/types";

type UseStartAgentTaskOutputOptions = Omit<
  UseMutationOptions<AgentTasksResponse, Error, StartAgentTaskOutputRequest>,
  "mutationFn"
>;

export function useStartAgentTaskOutput(
  options?: UseStartAgentTaskOutputOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: startAgentTaskOutputRequest,
    ...restOptions,
    onSuccess: (tasks, input, onMutateResult, context) => {
      queryClient.setQueryData(
        agentTasksKeys.detail(input.teammateId, input.projectId),
        tasks,
      );
      onSuccess?.(tasks, input, onMutateResult, context);
    },
  });
}
