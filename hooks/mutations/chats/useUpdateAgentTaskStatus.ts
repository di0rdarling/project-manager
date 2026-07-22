"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  updateAgentTaskStatusRequest,
  type UpdateAgentTaskStatusRequest,
} from "@/lib/api/agent-tasks";
import { agentTasksKeys } from "@/lib/query-keys";
import type { AgentTasksResponse } from "@/lib/types";

type UseUpdateAgentTaskStatusOptions = Omit<
  UseMutationOptions<AgentTasksResponse, Error, UpdateAgentTaskStatusRequest>,
  "mutationFn"
>;

export function useUpdateAgentTaskStatus(
  options?: UseUpdateAgentTaskStatusOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateAgentTaskStatusRequest,
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
