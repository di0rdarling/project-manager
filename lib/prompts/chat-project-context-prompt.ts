import { stripRichText } from "@/lib/rich-text";
import { formatChallengeItems } from "@/lib/challenges";
import { formatDomainKnowledgeItems } from "@/lib/domain-knowledge";
import type { ChallengeStatus, DomainKnowledgeConfidenceLevel } from "@/lib/types";

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

type FeatureContextItem = {
  title: string;
  content: string;
  linkedRequirementTitle?: string | null;
};

type ChallengeContextItem = {
  title: string;
  overview: string;
  status: ChallengeStatus | string;
};

type BuildChatProjectContextInput = {
  name: string;
  description: string;
  aiSummary: string | null;
  coreUsers: ProjectContextItem[];
  painPoints: ProjectContextItem[];
  challenges: ChallengeContextItem[];
  domainKnowledge: DomainKnowledgeContextItem[];
  requirements: ProjectContextItem[];
  features: FeatureContextItem[];
  tools: ProjectContextItem[];
  notes: ProjectContextItem[];
  featureNotes?: ProjectContextItem[];
  featureChallenges?: ChallengeContextItem[];
  featureDomainKnowledge?: DomainKnowledgeContextItem[];
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

function formatFeatureItems(items: FeatureContextItem[]): string {
  if (items.length === 0) {
    return "Features: None";
  }

  const formattedItems = items
    .map((item, index) => {
      const heading = item.title.trim() || "Untitled feature";
      const content = stripRichText(item.content);
      const linkedRequirement = item.linkedRequirementTitle?.trim();
      const linkedLine = linkedRequirement
        ? `\n   Linked requirement: ${linkedRequirement}`
        : "";

      return `${index + 1}. ${heading}${linkedLine}\n   ${content || "No description provided."}`;
    })
    .join("\n");

  return `Features:\n${formattedItems}`;
}

export function buildChatProjectContext({
  name,
  description,
  aiSummary,
  coreUsers,
  painPoints,
  challenges,
  domainKnowledge,
  requirements,
  features,
  tools,
  notes,
  featureNotes,
  featureChallenges,
  featureDomainKnowledge,
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
    formatChallengeItems(challenges),
    "",
    formatDomainKnowledgeItems(domainKnowledge),
    "",
    formatContentItems("Requirements", requirements),
    "",
    formatFeatureItems(features),
    "",
    formatContentItems("Tools", tools),
    "",
    formatContentItems("Notes", notes),
  );

  if (featureNotes !== undefined) {
    sections.push("", formatContentItems("Feature Notes", featureNotes));
  }

  if (featureChallenges !== undefined) {
    sections.push("", formatChallengeItems(featureChallenges, "Feature Challenges"));
  }

  if (featureDomainKnowledge !== undefined) {
    sections.push(
      "",
      formatDomainKnowledgeItems(featureDomainKnowledge, "Feature Domain Knowledge"),
    );
  }

  return sections.join("\n");
}
