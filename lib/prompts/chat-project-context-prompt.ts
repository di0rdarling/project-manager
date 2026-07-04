import { stripRichText } from "@/lib/rich-text";
import { getConfidenceLevelLabel } from "@/lib/domain-knowledge";
import type { DomainKnowledgeConfidenceLevel } from "@/lib/types";

type ProjectContextItem = {
  title?: string;
  name?: string;
  role?: string;
  content: string;
};

type DomainKnowledgeContextItem = {
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
};

type BuildChatProjectContextInput = {
  name: string;
  description: string;
  aiSummary: string | null;
  coreUsers: ProjectContextItem[];
  painPoints: ProjectContextItem[];
  domainKnowledge: DomainKnowledgeContextItem[];
  requirements: ProjectContextItem[];
  tools: ProjectContextItem[];
  notes: ProjectContextItem[];
};

function formatContentItems(
  label: string,
  items: ProjectContextItem[],
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

function formatDomainKnowledgeItems(items: DomainKnowledgeContextItem[]): string {
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

export function buildChatProjectContext({
  name,
  description,
  aiSummary,
  coreUsers,
  painPoints,
  domainKnowledge,
  requirements,
  tools,
  notes,
}: BuildChatProjectContextInput): string {
  const sections = [
    `Project Name: ${name}`,
    `Description: ${description.trim() || "No description provided."}`,
  ];

  if (aiSummary?.trim()) {
    sections.push("", "AI Summary:", aiSummary.trim());
  }

  sections.push(
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
  );

  return sections.join("\n");
}
