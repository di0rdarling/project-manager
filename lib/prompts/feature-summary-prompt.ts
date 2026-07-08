import { stripRichText } from "@/lib/rich-text";
import { formatChallengeItems } from "@/lib/challenges";
import { formatDomainKnowledgeItems } from "@/lib/domain-knowledge";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type {
  ChallengeStatus,
  DomainKnowledgeConfidenceLevel,
} from "@/lib/types";

type SummaryContentItem = {
  title?: string;
  content: string;
};

type SummaryChallengeItem = {
  title: string;
  overview: string;
  status: ChallengeStatus | string;
};

type SummaryDomainKnowledgeItem = {
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
};

type LinkedRequirement = {
  title: string;
  content: string;
} | null;

type BuildFeatureSummaryPromptInput = {
  projectName: string;
  projectDescription: string;
  title: string;
  content: string;
  linkedRequirement: LinkedRequirement;
  domainKnowledge: SummaryDomainKnowledgeItem[];
  challenges: SummaryChallengeItem[];
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
      const heading = (item.title ?? "").trim() || `Untitled ${label.slice(0, -1)}`;
      const content = stripRichText(item.content);

      return `${index + 1}. ${heading}\n   ${content || "No content provided."}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}

function formatLinkedRequirement(requirement: LinkedRequirement): string {
  if (!requirement) {
    return "Linked Requirement: None";
  }

  const title = requirement.title.trim() || "Untitled requirement";
  const content = stripRichText(requirement.content);

  return `Linked Requirement:\nTitle: ${title}\nContent: ${content || "No content provided."}`;
}

export function buildFeatureSummaryPrompt({
  projectName,
  projectDescription,
  title,
  content,
  linkedRequirement,
  domainKnowledge,
  challenges,
  notes,
}: BuildFeatureSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the feature below.",
    "Synthesize the feature's purpose, linked requirement, domain knowledge, current challenges, and important notes.",
    "Use the project context only as background when it helps explain the feature.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "Use clear plain text with no markdown or bullet lists.",
    "",
    `Project Name: ${projectName}`,
    `Project Description: ${projectDescription.trim() || "No description provided."}`,
    "",
    `Feature Title: ${title.trim() || "Untitled feature"}`,
    `Feature Description: ${stripRichText(content) || "No description provided."}`,
    "",
    formatLinkedRequirement(linkedRequirement),
    "",
    formatDomainKnowledgeItems(domainKnowledge),
    "",
    formatChallengeItems(challenges, "Current Challenges"),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
