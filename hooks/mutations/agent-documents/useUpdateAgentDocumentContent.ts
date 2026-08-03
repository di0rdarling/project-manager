"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateAgentDocumentContent } from "@/lib/api/agent-documents";
import { agentDocumentKeys, agentTasksKeys } from "@/lib/query-keys";
import type {
  AgentDocumentResponse,
  AgentDocumentReviewChatResponse,
  AgentTaskOverviewChatResponse,
  AgentTasksResponse,
} from "@/lib/types";

type UpdateAgentDocumentContentInput = Parameters<
  typeof updateAgentDocumentContent
>[0] & {
  projectId?: string | null;
};

type UseUpdateAgentDocumentContentOptions = Omit<
  UseMutationOptions<
    AgentDocumentResponse,
    Error,
    UpdateAgentDocumentContentInput
  >,
  "mutationFn"
>;

export function useUpdateAgentDocumentContent(
  options?: UseUpdateAgentDocumentContentOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateAgentDocumentContent,
    ...restOptions,
    onSuccess: (document, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        agentDocumentKeys.detail(variables.teammateId, variables.documentId),
        document,
      );

      queryClient.setQueryData<AgentDocumentReviewChatResponse>(
        agentDocumentKeys.reviewChat(
          variables.teammateId,
          variables.documentId,
        ),
        (current) => (current ? { ...current, document } : current),
      );

      queryClient.setQueryData<AgentDocumentResponse[]>(
        agentDocumentKeys.list(variables.teammateId),
        (current) =>
          current?.map((entry) =>
            entry._id === document._id ? document : entry,
          ) ?? current,
      );

      if (variables.projectId) {
        queryClient.setQueryData<AgentTasksResponse>(
          agentTasksKeys.detail(variables.teammateId, variables.projectId),
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              tasks: current.tasks.map((task) =>
                task.outputDocumentId === document._id
                  ? { ...task, outputDocumentTitle: document.title }
                  : task,
              ),
            };
          },
        );

        if (document.taskTitle) {
          queryClient.setQueryData<AgentTaskOverviewChatResponse>(
            agentTasksKeys.overviewChat(
              variables.teammateId,
              variables.projectId,
              document.taskTitle,
            ),
            (current) =>
              current
                ? {
                    ...current,
                    task: { ...current.task, outputDocumentTitle: document.title },
                  }
                : current,
          );
        }
      }

      onSuccess?.(document, variables, onMutateResult, context);
    },
  });
}
