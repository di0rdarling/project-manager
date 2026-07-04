"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDomainKnowledge } from "@/lib/api/domain-knowledge";
import { domainKnowledgeKeys } from "@/lib/query-keys";
import type { DomainKnowledgeResponse } from "@/lib/types";

type UseFetchDomainKnowledgeOptions = Omit<
  UseQueryOptions<DomainKnowledgeResponse[], Error>,
  "queryKey" | "queryFn"
>;

export function useFetchDomainKnowledge(
  projectId: string,
  options?: UseFetchDomainKnowledgeOptions,
) {
  return useQuery({
    queryKey: domainKnowledgeKeys.all(projectId),
    queryFn: () => fetchDomainKnowledge(projectId),
    ...options,
  });
}
