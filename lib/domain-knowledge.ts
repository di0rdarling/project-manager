import type { ObjectId } from "mongodb";
import { stripRichText } from "@/lib/rich-text";
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

export function projectLevelDomainKnowledgeFilter(projectId: ObjectId) {
  return {
    projectId,
    $or: [{ featureId: null }, { featureId: { $exists: false } }],
  };
}

export function featureDomainKnowledgeFilter(
  projectId: ObjectId,
  featureId: ObjectId,
) {
  return {
    projectId,
    featureId,
  };
}

type DomainKnowledgeContextItem = {
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
};

export function formatDomainKnowledgeItems(
  items: DomainKnowledgeContextItem[],
  label = "Domain Knowledge",
): string {
  if (items.length === 0) {
    return `${label}: None`;
  }

  const formattedItems = items
    .map((item, index) => {
      const name = item.name.trim() || "Untitled concept";
      const confidenceLabel = getConfidenceLevelLabel(item.confidenceLevel);
      const confidenceLine = confidenceLabel
        ? `\n   Confidence: ${confidenceLabel}`
        : "";
      const currentUnderstanding =
        stripRichText(item.currentUnderstanding) || "No understanding recorded.";
      const openQuestions = stripRichText(item.openQuestions);
      const openQuestionsLine = openQuestions
        ? `\n   Open questions: ${openQuestions}`
        : "";

      return `${index + 1}. ${name}${confidenceLine}\n   Current understanding: ${currentUnderstanding}${openQuestionsLine}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}
