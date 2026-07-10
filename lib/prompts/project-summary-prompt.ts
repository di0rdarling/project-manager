import { stripRichText } from "@/lib/rich-text";
import { formatChallengeItems } from "@/lib/challenges";
import { formatDomainKnowledgeItems } from "@/lib/domain-knowledge";
import { formatRequirementItems } from "@/lib/requirements";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type {
  ChallengeStatus,
  DomainKnowledgeConfidenceLevel,
  RequirementPriority,
} from "@/lib/types";

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

type SummaryRequirementItem = {
  title: string;
  content: string;
  priority: RequirementPriority | null;
};

type SummaryFeatureItem = {
  title: string;
  content: string;
  linkedRequirementTitles?: string[];
};

type SummaryChallengeItem = {
  title: string;
  overview: string;
  status: ChallengeStatus | string;
};

type BuildProjectSummaryPromptInput = {
  name: string;
  description: string;
  coreUsers: SummaryContentItem[];
  painPoints: SummaryContentItem[];
  challenges: SummaryChallengeItem[];
  domainKnowledge: SummaryDomainKnowledgeItem[];
  requirements: SummaryRequirementItem[];
  features: SummaryFeatureItem[];
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

function formatFeatureItems(items: SummaryFeatureItem[]): string {
  if (items.length === 0) {
    return "Features: None";
  }

  const formattedItems = items
    .map((item, index) => {
      const heading = item.title.trim() || "Untitled feature";
      const content = stripRichText(item.content);
      const linkedRequirements = (item.linkedRequirementTitles ?? [])
        .map((title) => title.trim())
        .filter(Boolean);
      const linkedLine =
        linkedRequirements.length > 0
          ? `\n   Linked requirements: ${linkedRequirements.join(", ")}`
          : "";

      return `${index + 1}. ${heading}${linkedLine}\n   ${content || "No description provided."}`;
    })
    .join("\n");

  return `Features:\n${formattedItems}`;
}

export function buildProjectSummaryPrompt({
  name,
  description,
  coreUsers,
  painPoints,
  challenges,
  domainKnowledge,
  requirements,
  features,
  tools,
  notes,
}: BuildProjectSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the project below.",
    "Synthesize the project's purpose, key stakeholders, pain points, current project challenges, domain knowledge, requirements, features, tools, and important notes.",
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
    formatChallengeItems(challenges),
    "",
    formatDomainKnowledgeItems(domainKnowledge),
    "",
    formatRequirementItems(requirements),
    "",
    formatFeatureItems(features),
    "",
    formatContentItems("Tools", tools),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
