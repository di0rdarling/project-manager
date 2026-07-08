import type { ChallengeStatus } from "@/lib/types";
import { stripRichText } from "@/lib/rich-text";

export const CHALLENGE_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
] as const;

export function parseChallengeStatus(value: unknown): ChallengeStatus | null {
  if (value === "open" || value === "in_progress" || value === "resolved") {
    return value;
  }

  return null;
}

export function getChallengeStatusLabel(status: ChallengeStatus): string {
  const match = CHALLENGE_STATUS_OPTIONS.find((option) => option.value === status);
  return match?.label ?? status;
}

type ChallengeContextItem = {
  title: string;
  overview: string;
  status: ChallengeStatus | string;
};

export function formatChallengeItems(items: ChallengeContextItem[]): string {
  if (items.length === 0) {
    return "Current Challenges: None";
  }

  const formattedItems = items
    .map((item, index) => {
      const heading = item.title.trim() || "Untitled challenge";
      const status = parseChallengeStatus(item.status) ?? "open";
      const statusLabel = getChallengeStatusLabel(status);
      const overview = stripRichText(item.overview) || "No overview provided.";

      return `${index + 1}. ${heading}\n   Status: ${statusLabel}\n   ${overview}`;
    })
    .join("\n");

  return `Current Challenges:\n${formattedItems}`;
}
