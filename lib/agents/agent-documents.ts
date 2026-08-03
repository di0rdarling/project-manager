import type { AgentDocumentStatus } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

export const AGENT_DOCUMENT_STATUS_OPTIONS = [
  { value: "ready_for_review", label: "Ready for review" },
  { value: "in_review", label: "In review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export function parseAgentDocumentStatus(
  value: unknown,
): AgentDocumentStatus | null {
  if (
    value === "ready_for_review" ||
    value === "in_review" ||
    value === "accepted" ||
    value === "rejected"
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

export function isAgentDocumentInReviewStage(
  status: AgentDocumentStatus,
): boolean {
  return status === "ready_for_review" || status === "in_review";
}

export function isAgentDocumentAccepted(
  status: AgentDocumentStatus,
): boolean {
  return status === "accepted";
}

export function canAcceptAgentDocument(
  status: AgentDocumentStatus,
): boolean {
  return isAgentDocumentInReviewStage(status);
}

/** Deliverable content can only be hand-edited while it's awaiting sign-off. */
export function canEditAgentDocument(status: AgentDocumentStatus): boolean {
  return isAgentDocumentInReviewStage(status);
}

export function canRejectAgentDocument(
  status: AgentDocumentStatus,
): boolean {
  return isAgentDocumentInReviewStage(status);
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
    case "rejected":
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
  }
}

export function getAgentDocumentDetailPath(
  teammateId: ChatTeammateId,
  documentId: string,
): string {
  return `/chats/agents/${teammateId}/documents/${documentId}`;
}

export function canSaveAgentDocumentAsProjectNote(document: {
  status: AgentDocumentStatus;
}): boolean {
  return isAgentDocumentAccepted(document.status);
}

export function hasSavedAgentDocumentAsProjectNote(document: {
  savedProjectNoteId?: string;
}): boolean {
  return Boolean(document.savedProjectNoteId?.trim());
}
