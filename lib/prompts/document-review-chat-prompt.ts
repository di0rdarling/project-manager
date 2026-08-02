import { getAgentDocumentStatusLabel } from "@/lib/agents/agent-documents";
import {
  getAgentTaskStatus,
  getAgentTaskStatusLabel,
} from "@/lib/agents/agent-tasks";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";

type BuildDocumentReviewFocusContextInput = {
  document: AgentDocumentResponse;
  task: AgentTask | null;
};

/**
 * Lightweight focus block for when the user is actively reviewing a
 * deliverable. Full document content is already included in the standing
 * autonomous tasks and deliverables context.
 */
export function buildDocumentReviewFocusContext({
  document,
  task,
}: BuildDocumentReviewFocusContextInput): string {
  const sections = [
    "The user is currently viewing one of your deliverables alongside this conversation. The full content of all your deliverables is already included in your autonomous tasks and deliverables context above — do not ask them to paste it or claim you cannot see it.",
    "Help them understand your work, answer questions about specific sections, and discuss any changes they want before sign-off. Do not regenerate or rewrite the entire document in chat unless they explicitly ask you to redo the task.",
    "",
    "### Deliverable the user is viewing now",
    "",
    `Title: ${document.title}`,
    `Document status: ${getAgentDocumentStatusLabel(document.status)}`,
  ];

  if (task) {
    sections.push(
      "",
      `Linked task: ${task.title}`,
      `Task status: ${getAgentTaskStatusLabel(getAgentTaskStatus(task))}`,
    );
  } else if (document.taskTitle) {
    sections.push("", `Linked task: ${document.taskTitle}`);
  }

  return sections.join("\n");
}

/** @deprecated Use buildDocumentReviewFocusContext — kept as alias during migration */
export const buildDocumentReviewContext = buildDocumentReviewFocusContext;
