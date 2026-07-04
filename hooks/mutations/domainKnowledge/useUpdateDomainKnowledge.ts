"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { updateDomainKnowledge } from "@/lib/api/domain-knowledge";
import { domainKnowledgeKeys } from "@/lib/query-keys";
import type { DomainKnowledgeResponse } from "@/lib/types";

type UpdateDomainKnowledgeInput = Parameters<typeof updateDomainKnowledge>[0];

type UseUpdateDomainKnowledgeOptions = Omit<
  UseMutationOptions<
    DomainKnowledgeResponse,
    Error,
    UpdateDomainKnowledgeInput
  >,
  "mutationFn"
>;

export function useUpdateDomainKnowledge(
  options?: UseUpdateDomainKnowledgeOptions,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: updateDomainKnowledge,
    ...restOptions,
    onSuccess: (item, variables, onMutateResult, context) => {
      queryClient.setQueryData<DomainKnowledgeResponse[]>(
        domainKnowledgeKeys.all(variables.projectId),
        (current) =>
          current?.map((existing) =>
            existing._id === item._id ? item : existing,
          ),
      );
      onSuccess?.(item, variables, onMutateResult, context);
    },
  });
}
