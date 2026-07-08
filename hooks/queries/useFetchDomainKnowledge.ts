"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchDomainKnowledge } from "@/lib/api/domain-knowledge";
import { domainKnowledgeKeys } from "@/lib/query-keys";
import type { DomainKnowledgeResponse } from "@/lib/types";

type UseFetchDomainKnowledgeOptions = Omit<
  UseQueryOptions<DomainKnowledgeResponse[], Error>,
  "queryKey" | "queryFn"
> & {
  featureId?: string | null;
};

export function useFetchDomainKnowledge(
  projectId: string,
  options?: UseFetchDomainKnowledgeOptions,
) {
  const { featureId, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: domainKnowledgeKeys.list(projectId, featureId),
    queryFn: () => fetchDomainKnowledge(projectId, featureId),
    ...queryOptions,
  });
}
