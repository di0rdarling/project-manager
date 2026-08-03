import { getAgentDocumentStatusLabel } from "@/lib/agents/agent-documents";
import {
  getAgentTaskDecisionStatus,
  getAgentTaskStatus,
  getAgentTaskStatusLabel,
} from "@/lib/agents/agent-tasks";
import type { AgentTask } from "@/lib/types";

export function appendAgentTaskIdentitySections(
  sections: string[],
  task: AgentTask,
): void {
  sections.push(
    "",
    "### Task this conversation is about",
    "",
    `Title: ${task.title}`,
    `Status: ${getAgentTaskStatusLabel(getAgentTaskStatus(task))}`,
    `Decision: ${getAgentTaskDecisionStatus(task)}`,
  );
}

export function appendAgentTaskDetailSections(
  sections: string[],
  task: AgentTask,
): void {
  sections.push("", `Detail: ${task.detail}`);

  if (task.outputDescription?.trim()) {
    sections.push("", `Planned deliverable: ${task.outputDescription.trim()}`);
  }

  if (task.rationale?.trim()) {
    sections.push("", `Why you suggested it: ${task.rationale.trim()}`);
  }

  if (task.impact?.trim()) {
    sections.push("", `Impact if done: ${task.impact.trim()}`);
  }

  if (task.riskIfSkipped?.trim()) {
    sections.push("", `Risk if skipped: ${task.riskIfSkipped.trim()}`);
  }

  if (task.projectName?.trim()) {
    sections.push("", `Project: ${task.projectName.trim()}`);
  }

  if (task.outputDocumentTitle?.trim()) {
    sections.push("", `Deliverable title: ${task.outputDocumentTitle.trim()}`);
  }

  if (task.outputDocumentStatus) {
    sections.push(
      "",
      `Deliverable status: ${getAgentDocumentStatusLabel(task.outputDocumentStatus)}`,
    );
  }

  if (task.outputCompletionSummary?.trim()) {
    sections.push(
      "",
      `How the deliverable completes the task: ${task.outputCompletionSummary.trim()}`,
    );
  }
}
