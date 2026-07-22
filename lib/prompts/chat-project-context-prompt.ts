import { stripRichText } from "@/lib/rich-text";
import { formatChallengeItems } from "@/lib/challenges";
import { formatDomainKnowledgeItems } from "@/lib/domain-knowledge";
import { formatRequirementItems } from "@/lib/requirements";
import type {
  ChallengeStatus,
  DomainKnowledgeConfidenceLevel,
  RequirementPriority,
} from "@/lib/types";

type ProjectContextItem = {
  title?: string;
  name?: string;
  role?: string;
  content: string;
};

type NoteContextItem = {
  title: string;
  content: string;
  /** Set when the note belongs to a feature; omitted for project-level notes. */
  featureTitle?: string | null;
};

type DomainKnowledgeContextItem = {
  name: string;
  currentUnderstanding: string;
  openQuestions: string;
  confidenceLevel: DomainKnowledgeConfidenceLevel | null;
};

type RequirementContextItem = {
  title: string;
  content: string;
  priority: RequirementPriority | null;
};

type FeatureContextItem = {
  title: string;
  content: string;
  linkedRequirementTitles?: string[];
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
  requirements: RequirementContextItem[];
  features: FeatureContextItem[];
  tools: ProjectContextItem[];
  notes: NoteContextItem[];
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

function formatNoteItems(items: NoteContextItem[]): string {
  if (items.length === 0) {
    return "Notes: None";
  }

  const formattedItems = items
    .map((item, index) => {
      const heading = item.title.trim() || "Untitled note";
      const content = stripRichText(item.content);
      const featureLine = item.featureTitle?.trim()
        ? `\n   Feature: ${item.featureTitle.trim()}`
        : "";

      return `${index + 1}. ${heading}${featureLine}\n   ${content || "No content provided."}`;
    })
    .join("\n");

  return `Notes:\n${formattedItems}`;
}

function formatFeatureItems(items: FeatureContextItem[]): string {
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
    formatRequirementItems(requirements),
    "",
    formatFeatureItems(features),
    "",
    formatContentItems("Tools", tools),
    "",
    formatNoteItems(notes),
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
