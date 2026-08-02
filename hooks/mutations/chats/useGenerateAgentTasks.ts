"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  generateAgentTasksRequest,
  type GenerateAgentTasksRequest,
} from "@/lib/api/agent-tasks";
import { agentTasksKeys, dashboardKeys } from "@/lib/query-keys";
import type { AgentTasksResponse } from "@/lib/types";

type UseGenerateAgentTasksOptions = Omit<
  UseMutationOptions<AgentTasksResponse, Error, GenerateAgentTasksRequest>,
  "mutationFn"
>;

export function useGenerateAgentTasks(options?: UseGenerateAgentTasksOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: generateAgentTasksRequest,
    ...restOptions,
    onSuccess: (tasks, input, onMutateResult, context) => {
      queryClient.setQueryData(
        agentTasksKeys.detail(input.teammateId, input.projectId),
        tasks,
      );
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.tasks });
      onSuccess?.(tasks, input, onMutateResult, context);
    },
  });
}
