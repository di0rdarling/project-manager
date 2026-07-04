import { stripRichText } from "@/lib/rich-text";
import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";

type SummaryContentItem = {
  title?: string;
  name?: string;
  content: string;
};

type BuildProjectSummaryPromptInput = {
  name: string;
  description: string;
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
      const content = stripRichText(item.content);

      return `${index + 1}. ${heading}\n   ${content || "No content provided."}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}

export function buildProjectSummaryPrompt({
  name,
  description,
  requirements,
  tools,
  notes,
}: BuildProjectSummaryPromptInput): string {
  const sections = [
    "You are a project management assistant.",
    "Write a concise 2-3 paragraph overview of the project below.",
    "Synthesize the project's purpose, key requirements, tools, and important notes.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "Use clear plain text with no markdown or bullet lists.",
    "",
    `Project Name: ${name}`,
    `Description: ${description.trim() || "No description provided."}`,
    "",
    formatContentItems("Requirements", requirements),
    "",
    formatContentItems("Tools", tools),
    "",
    formatContentItems("Notes", notes),
  ];

  return sections.join("\n");
}
