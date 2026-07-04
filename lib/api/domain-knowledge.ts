import type {
  DomainKnowledgeConfidenceLevel,
  DomainKnowledgeResponse,
} from "@/lib/types";
import { parseResponse } from "@/lib/api/response";

export async function fetchDomainKnowledge(
  projectId: string,
): Promise<DomainKnowledgeResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/domain-knowledge`);
  return parseResponse<DomainKnowledgeResponse[]>(response);
}

export async function createDomainKnowledge(input: {
  projectId: string;
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
}): Promise<DomainKnowledgeResponse> {
  const {
    projectId,
    name,
    currentUnderstanding,
    openQuestions,
    confidenceLevel,
  } = input;
  const response = await fetch(`/api/projects/${projectId}/domain-knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      currentUnderstanding,
      openQuestions,
      confidenceLevel,
    }),
  });

  return parseResponse<DomainKnowledgeResponse>(response);
}

export async function updateDomainKnowledge(input: {
  projectId: string;
  domainKnowledgeId: string;
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
}): Promise<DomainKnowledgeResponse> {
  const {
    projectId,
    domainKnowledgeId,
    name,
    currentUnderstanding,
    openQuestions,
    confidenceLevel,
  } = input;
  const response = await fetch(
    `/api/projects/${projectId}/domain-knowledge/${domainKnowledgeId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        currentUnderstanding,
        openQuestions,
        confidenceLevel,
      }),
    },
  );

  return parseResponse<DomainKnowledgeResponse>(response);
}

export async function deleteDomainKnowledge(input: {
  projectId: string;
  domainKnowledgeId: string;
}): Promise<void> {
  const { projectId, domainKnowledgeId } = input;
  const response = await fetch(
    `/api/projects/${projectId}/domain-knowledge/${domainKnowledgeId}`,
    {
      method: "DELETE",
    },
  );

  await parseResponse<{ success: true }>(response);
}
