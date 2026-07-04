"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createDomainKnowledge } from "@/lib/api/domain-knowledge";
import { domainKnowledgeKeys } from "@/lib/query-keys";
import type { DomainKnowledgeResponse } from "@/lib/types";

type CreateDomainKnowledgeInput = Parameters<typeof createDomainKnowledge>[0];

type UseCreateDomainKnowledgeOptions = Omit<
  UseMutationOptions<
    DomainKnowledgeResponse,
    Error,
    CreateDomainKnowledgeInput
  >,
  "mutationFn"
>;

export function useCreateDomainKnowledge(
  options?: UseCreateDomainKnowledgeOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: createDomainKnowledge,
    ...restOptions,
    onSuccess: (item, variables, onMutateResult, context) => {
      queryClient.setQueryData<DomainKnowledgeResponse[]>(
        domainKnowledgeKeys.all(variables.projectId),
        (current) => (current ? [item, ...current] : [item]),
      );
      onSuccess?.(item, variables, onMutateResult, context);
    },
  });
}
