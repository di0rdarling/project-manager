import type { RequirementPriority } from "@/lib/types";
import { stripRichText } from "@/lib/rich-text";

export const REQUIREMENT_PRIORITY_OPTIONS = [
  { value: "must_have", label: "Must have" },
  { value: "should_have", label: "Should have" },
  { value: "could_have", label: "Could have" },
] as const;

export function parseRequirementPriority(
  value: unknown,
): RequirementPriority | null {
  if (value === "must_have" || value === "should_have" || value === "could_have") {
    return value;
  }

  return null;
}

export function getRequirementPriorityLabel(
  priority: RequirementPriority,
): string {
  const match = REQUIREMENT_PRIORITY_OPTIONS.find(
    (option) => option.value === priority,
  );
  return match?.label ?? priority;
}

type RequirementContextItem = {
  title: string;
  content: string;
  priority: RequirementPriority | null;
};

export function formatRequirementItems(
  items: RequirementContextItem[],
  label = "Requirements",
): string {
  if (items.length === 0) {
    return `${label}: None`;
  }

  const formattedItems = items
    .map((item, index) => {
      const heading = item.title.trim() || "Untitled requirement";
      const priority = parseRequirementPriority(item.priority);
      const priorityLine = priority
        ? `\n   Priority: ${getRequirementPriorityLabel(priority)}`
        : "";
      const content = stripRichText(item.content) || "No content provided.";

      return `${index + 1}. ${heading}${priorityLine}\n   ${content}`;
    })
    .join("\n");

  return `${label}:\n${formattedItems}`;
}
