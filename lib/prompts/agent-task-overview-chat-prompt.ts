import {
  getAgentTaskDecisionStatus,
  getAgentTaskStatus,
  getAgentTaskStatusLabel,
} from "@/lib/agents/agent-tasks";
import type { AgentTask } from "@/lib/types";

type BuildAgentTaskOverviewFocusContextInput = {
  task: AgentTask;
};

/**
 * Focus block for when the user is discussing a suggested autonomous task
 * before accepting or rejecting it.
 */
export function buildAgentTaskOverviewFocusContext({
  task,
}: BuildAgentTaskOverviewFocusContextInput): string {
  const decisionStatus = getAgentTaskDecisionStatus(task);
  const sections = [
    "The user is currently viewing one of your suggested autonomous tasks alongside this conversation. Your full list of suggested and accepted tasks is already included in your autonomous tasks and deliverables context above — do not ask them to paste task details or claim you cannot see them.",
    "Help them understand why you suggested this task, answer questions about scope and impact, discuss alternatives, and clarify what you would produce if they accept. Do not start working on the task or generate the deliverable in chat unless they explicitly accept it and ask you to begin.",
    "",
    "### Task the user is viewing now",
    "",
    `Title: ${task.title}`,
    `Decision status: ${getAgentTaskStatusLabel(getAgentTaskStatus(task))} (${decisionStatus})`,
    "",
    `Detail: ${task.detail}`,
  ];

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

  return sections.join("\n");
}
