import { stripRichText } from "@/lib/rich-text";

type ProjectContextItem = {
  title?: string;
  name?: string;
  role?: string;
  content: string;
};

type BuildChatProjectContextInput = {
  name: string;
  description: string;
  aiSummary: string | null;
  coreUsers: ProjectContextItem[];
  painPoints: ProjectContextItem[];
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

export function buildChatProjectContext({
  name,
  description,
  aiSummary,
  coreUsers,
  painPoints,
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
    formatContentItems("Requirements", requirements),
    "",
    formatContentItems("Tools", tools),
    "",
    formatContentItems("Notes", notes),
  );

  return sections.join("\n");
}
