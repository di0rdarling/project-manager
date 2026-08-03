import { getAgentDocumentStatusLabel } from "@/lib/agents/agent-documents";
import {
  getAgentTaskStatus,
  getAgentTaskStatusLabel,
} from "@/lib/agents/agent-tasks";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";
import {
  appendAgentTaskDetailSections,
  appendAgentTaskIdentitySections,
} from "@/lib/prompts/agent-task-focus-context-sections";

type BuildDocumentReviewFocusContextInput = {
  document: AgentDocumentResponse;
  task: AgentTask | null;
  continuesTaskConversation?: boolean;
};

/**
 * Focus block for when the user is actively reviewing a deliverable.
 * Full document content is already included in the standing autonomous
 * tasks and deliverables context.
 */
export function buildDocumentReviewFocusContext({
  document,
  task,
  continuesTaskConversation = false,
}: BuildDocumentReviewFocusContextInput): string {
  const sections: string[] = [];

  if (continuesTaskConversation) {
    sections.push(
      "This is one continuous conversation about an autonomous task you suggested. The transcript may include discussion from before the user accepted the task, while they were deciding on scope, and now while they review the deliverable you produced. Continue naturally from that history — do not treat this as a new thread.",
    );
  }

  sections.push(
    "The user is currently viewing this deliverable alongside the conversation. The task is in the review stage — they are evaluating your work and may ask for clarifications or changes before sign-off.",
    "Your full task list and the complete content of all your deliverables are already included in your autonomous tasks and deliverables context above — do not ask them to paste it or claim you cannot see it.",
    "Ground replies in what this task was meant to accomplish (see the task details below) and what you actually produced. Help them understand your work, answer questions about specific sections, and discuss any changes they want before sign-off. Do not regenerate or rewrite the entire document in chat unless they explicitly ask you to redo the task.",
  );

  if (task) {
    appendAgentTaskIdentitySections(sections, task);
    appendAgentTaskDetailSections(sections, task);
  } else if (document.taskTitle) {
    sections.push(
      "",
      "### Task this conversation is about",
      "",
      `Title: ${document.taskTitle}`,
    );
  }

  sections.push(
    "",
    "### Deliverable the user is viewing now",
    "",
    `Title: ${document.title}`,
    `Document status: ${getAgentDocumentStatusLabel(document.status)}`,
  );

  if (
    task?.outputDocumentTitle &&
    task.outputDocumentTitle.trim() !== document.title.trim()
  ) {
    sections.push("", `Linked deliverable title: ${task.outputDocumentTitle.trim()}`);
  }

  if (task) {
    sections.push(
      "",
      `Task status: ${getAgentTaskStatusLabel(getAgentTaskStatus(task))}`,
    );
  }

  return sections.join("\n");
}

/** @deprecated Use buildDocumentReviewFocusContext — kept as alias during migration */
export const buildDocumentReviewContext = buildDocumentReviewFocusContext;
