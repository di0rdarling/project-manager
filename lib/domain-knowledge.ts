import type { DomainKnowledgeConfidenceLevel } from "@/lib/types";

export const DOMAIN_KNOWLEDGE_CONFIDENCE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "novice", label: "Novice" },
  { value: "learning", label: "Learning" },
  { value: "comfortable", label: "Comfortable" },
] as const;

export function parseConfidenceLevel(
  value: unknown,
): DomainKnowledgeConfidenceLevel | null {
  if (value === "novice" || value === "learning" || value === "comfortable") {
    return value;
  }

  return null;
}

export function getConfidenceLevelLabel(
  level: DomainKnowledgeConfidenceLevel | null,
): string | null {
  if (!level) {
    return null;
  }

  const match = DOMAIN_KNOWLEDGE_CONFIDENCE_OPTIONS.find(
    (option) => option.value === level,
  );

  return match?.label ?? null;
}
