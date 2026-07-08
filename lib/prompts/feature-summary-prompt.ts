import { stripRichText } from "@/lib/rich-text";
import { formatChallengeItems } from "@/lib/challenges";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type { ChallengeStatus } from "@/lib/types";

type SummaryContentItem = {
  title?: string;
  content: string;
};

type SummaryChallengeItem = {
  title: string;
  overview: string;
  status: ChallengeStatus | string;
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
  challenges,
  notes,
}: BuildFeatureSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the feature below.",
    "Synthesize the feature's purpose, linked requirement, current challenges, and important notes.",
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
    formatChallengeItems(challenges, "Current Challenges"),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
