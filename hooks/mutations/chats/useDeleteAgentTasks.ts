"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  deleteAgentTasks,
  type AgentTasksRequest,
} from "@/lib/api/agent-tasks";
import { agentTasksKeys } from "@/lib/query-keys";
import type { AgentTasksResponse } from "@/lib/types";

type UseDeleteAgentTasksOptions = Omit<
  UseMutationOptions<AgentTasksResponse, Error, AgentTasksRequest>,
  "mutationFn"
>;

export function useDeleteAgentTasks(options?: UseDeleteAgentTasksOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteAgentTasks,
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
