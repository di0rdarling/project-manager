"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { acceptAgentDocument } from "@/lib/api/agent-documents";
import {
  agentDocumentKeys,
  agentTasksKeys,
} from "@/lib/query-keys";
import type {
  AgentDocumentResponse,
  AgentDocumentReviewChatResponse,
  AgentTasksResponse,
} from "@/lib/types";

type AcceptAgentDocumentInput = Parameters<typeof acceptAgentDocument>[0] & {
  projectId?: string | null;
};

type UseAcceptAgentDocumentOptions = Omit<
  UseMutationOptions<AgentDocumentResponse, Error, AcceptAgentDocumentInput>,
  "mutationFn"
>;

export function useAcceptAgentDocument(
  options?: UseAcceptAgentDocumentOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: acceptAgentDocument,
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
        (current) =>
          current ? { ...current, document } : current,
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
                  ? { ...task, outputDocumentStatus: document.status }
                  : task,
              ),
            };
          },
        );
      }

      onSuccess?.(document, variables, onMutateResult, context);
    },
  });
}
