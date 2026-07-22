import type { AgentDocumentStatus } from "@/lib/types";

export const AGENT_DOCUMENT_STATUS_OPTIONS = [
  { value: "ready_for_review", label: "Ready for review" },
  { value: "in_review", label: "In review" },
  { value: "accepted", label: "Accepted" },
] as const;

export function parseAgentDocumentStatus(
  value: unknown,
): AgentDocumentStatus | null {
  if (
    value === "ready_for_review" ||
    value === "in_review" ||
    value === "accepted"
  ) {
    return value;
  }

  return null;
}

export function getAgentDocumentStatusLabel(
  status: AgentDocumentStatus,
): string {
  const match = AGENT_DOCUMENT_STATUS_OPTIONS.find(
    (option) => option.value === status,
  );
  return match?.label ?? status;
}

export function getAgentDocumentStatusBadgeClassName(
  status: AgentDocumentStatus,
): string {
  switch (status) {
    case "ready_for_review":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "in_review":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
}
