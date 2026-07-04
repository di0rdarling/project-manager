import { stripRichText } from "@/lib/rich-text";
import { getConfidenceLevelLabel } from "@/lib/domain-knowledge";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type { DomainKnowledgeConfidenceLevel } from "@/lib/types";

type SummaryContentItem = {
  title?: string;
  name?: string;
  role?: string;
  content: string;
};

type SummaryDomainKnowledgeItem = {
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
};

type BuildProjectSummaryPromptInput = {
  name: string;
  description: string;
  coreUsers: SummaryContentItem[];
  painPoints: SummaryContentItem[];
  domainKnowledge: SummaryDomainKnowledgeItem[];
  requirements: SummaryContentItem[];
  tools: SummaryContentItem[];
  notes: SummaryContentItem[];
};

function formatContentItems(
  label: string,
  items: SummaryContentItem[],
): string {
  if (items.length === 0) {
    return `${label}: None`;
  }

  const formattedItems = items
    .map((item, index) => {
      const heading =
        (item.title ?? item.name ?? "").trim() ||
        `Untitled ${label.slice(0, -1)}`;
      const role = item.role?.trim();
      const content = stripRichText(item.content);
      const roleLine = role ? `\n   Role: ${role}` : "";

      return `${index + 1}. ${heading}${roleLine}\n   ${content || "No content provided."}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}

function formatDomainKnowledgeItems(
  items: SummaryDomainKnowledgeItem[],
): string {
  if (items.length === 0) {
    return "Domain Knowledge: None";
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

  return `Domain Knowledge:\n${formattedItems}`;
}

export function buildProjectSummaryPrompt({
  name,
  description,
  coreUsers,
  painPoints,
  domainKnowledge,
  requirements,
  tools,
  notes,
}: BuildProjectSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the project below.",
    "Synthesize the project's purpose, key stakeholders, pain points, domain knowledge, requirements, tools, and important notes.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "Use clear plain text with no markdown or bullet lists.",
    "",
    `Project Name: ${name}`,
    `Description: ${description.trim() || "No description provided."}`,
    "",
    formatContentItems("Core Users", coreUsers),
    "",
    formatContentItems("Pain Points", painPoints),
    "",
    formatDomainKnowledgeItems(domainKnowledge),
    "",
    formatContentItems("Requirements", requirements),
    "",
    formatContentItems("Tools", tools),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
