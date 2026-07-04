import { stripRichText } from "@/lib/rich-text";

type SummaryContentItem = {
  title: string;
  content: string;
};

type BuildProjectSummaryPromptInput = {
  name: string;
  description: string;
  requirements: SummaryContentItem[];
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
      const title = item.title.trim() || `Untitled ${label.slice(0, -1)}`;
      const content = stripRichText(item.content);

      return `${index + 1}. ${title}\n   ${content || "No content provided."}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}

export function buildProjectSummaryPrompt({
  name,
  description,
  requirements,
  notes,
}: BuildProjectSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the project below.",
    "Synthesize the project's purpose, key requirements, and important notes.",
    "Use clear, professional plain text with no markdown or bullet lists.",
    "",
    `Project Name: ${name}`,
    `Description: ${description.trim() || "No description provided."}`,
    "",
    formatContentItems("Requirements", requirements),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
