"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { rejectAgentDocument } from "@/lib/api/agent-documents";
import {
  agentDocumentKeys,
  agentTasksKeys,
} from "@/lib/query-keys";
import type {
  AgentDocumentResponse,
  RejectAgentDocumentResponse,
} from "@/lib/types";

type RejectAgentDocumentInput = Parameters<typeof rejectAgentDocument>[0] & {
  projectId?: string | null;
};

type UseRejectAgentDocumentOptions = Omit<
  UseMutationOptions<
    RejectAgentDocumentResponse,
    Error,
    RejectAgentDocumentInput
  >,
  "mutationFn"
>;

export function useRejectAgentDocument(
  options?: UseRejectAgentDocumentOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: rejectAgentDocument,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.removeQueries({
        queryKey: agentDocumentKeys.detail(
          variables.teammateId,
          variables.documentId,
        ),
      });
      queryClient.removeQueries({
        queryKey: agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
        ),
      });

      queryClient.setQueryData<AgentDocumentResponse[]>(
        agentDocumentKeys.list(variables.teammateId),
        (current) =>
          current?.filter((entry) => entry._id !== data.documentId) ?? current,
      );

      queryClient.setQueryData(
        agentTasksKeys.detail(data.tasks.teammateId, data.tasks.projectId),
        data.tasks,
      );

      if (data.taskTitle) {
        void queryClient.invalidateQueries({
          queryKey: agentTasksKeys.overviewChat(
            data.tasks.teammateId,
            data.tasks.projectId,
            data.taskTitle,
          ),
        });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
