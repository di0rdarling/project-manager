"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { deleteDomainKnowledge } from "@/lib/api/domain-knowledge";
import { domainKnowledgeKeys } from "@/lib/query-keys";
import type { DomainKnowledgeResponse } from "@/lib/types";

type DeleteDomainKnowledgeInput = Parameters<typeof deleteDomainKnowledge>[0];

type UseDeleteDomainKnowledgeOptions = Omit<
  UseMutationOptions<void, Error, DeleteDomainKnowledgeInput>,
  "mutationFn"
>;

export function useDeleteDomainKnowledge(
  options?: UseDeleteDomainKnowledgeOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: deleteDomainKnowledge,
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<DomainKnowledgeResponse[]>(
        domainKnowledgeKeys.list(variables.projectId, variables.featureId),
        (current) =>
          current?.filter(
            (item) => item._id !== variables.domainKnowledgeId,
          ),
      );
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
