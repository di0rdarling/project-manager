import { getAgentTaskStatus } from "@/lib/agents/agent-tasks";
import type { AgentTask } from "@/lib/types";
import {
  appendAgentTaskDetailSections,
  appendAgentTaskIdentitySections,
} from "@/lib/prompts/agent-task-focus-context-sections";

type BuildAgentTaskOverviewFocusContextInput = {
  task: AgentTask;
};

function buildOverviewStageGuidance(task: AgentTask): string[] {
  const taskStatus = getAgentTaskStatus(task);

  switch (taskStatus) {
    case "pending":
      return [
        "The user is currently viewing one of your suggested autonomous tasks alongside this conversation. Your full list of suggested and accepted tasks is already included in your autonomous tasks and deliverables context above — do not ask them to paste task details or claim you cannot see them.",
        "Help them understand why you suggested this task, answer questions about scope and impact, discuss alternatives, and clarify what you would produce if they accept. Do not start working on the task or generate the deliverable in chat unless they explicitly accept it and ask you to begin.",
        "When you and the user agree on changes to this suggestion, call the update_task tool to save those edits (title, detail, rationale, impact, risk_if_skipped, output_description, project_name). Confirm what you changed in your reply. Only update fields you are revising — do not rewrite unchanged fields.",
      ];
    case "accepted":
      return [
        "The user accepted this autonomous task and you are working on or have been asked to produce its deliverable. Your full task list and any deliverable content are already included in your autonomous tasks and deliverables context above — do not ask them to paste details or claim you cannot see them.",
        "Help them with scope questions, progress, or changes to the plan while the deliverable is being produced. Do not regenerate or rewrite the entire deliverable in chat unless they explicitly ask you to redo the task.",
      ];
    case "in_review":
      return [
        "This task is in the review stage: you produced a deliverable and the user is deciding whether to sign off. They may be viewing this conversation from the task overview or alongside the deliverable itself.",
        "The transcript may include earlier discussion from before they accepted the task. Continue naturally from that history — do not treat review as a new thread.",
        "Your full deliverable content and task list are already included in your autonomous tasks and deliverables context above — do not ask them to paste it or claim you cannot see it.",
        "Help them understand your work, answer questions about specific sections, and discuss any changes they want before sign-off. Do not regenerate or rewrite the entire deliverable in chat unless they explicitly ask you to redo the task.",
      ];
    case "completed":
      return [
        "This autonomous task is complete — the user signed off on your deliverable. Your task list and deliverable content are already included in your autonomous tasks and deliverables context above.",
        "Answer follow-up questions about what you produced and how it relates to the original task. Do not regenerate the deliverable unless they explicitly ask for a redo.",
      ];
    case "rejected":
      return [
        "The user rejected this task suggestion. Your full task list is already included in your autonomous tasks and deliverables context above.",
        "Help them understand the rejection, discuss alternatives, or refine the suggestion if they want to revisit it. Do not produce a deliverable unless they explicitly accept the task again.",
      ];
  }
}

/**
 * Focus block for when the user is discussing an autonomous task from the
 * overview tab — before acceptance, during output, or while in review.
 */
export function buildAgentTaskOverviewFocusContext({
  task,
}: BuildAgentTaskOverviewFocusContextInput): string {
  const sections = [...buildOverviewStageGuidance(task)];

  appendAgentTaskIdentitySections(sections, task);
  appendAgentTaskDetailSections(sections, task);

  return sections.join("\n");
}
