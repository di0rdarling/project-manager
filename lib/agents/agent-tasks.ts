import { AGENT_TASK_COUNT } from "@/lib/agents/agent-tasks-json";
import {
  isAgentDocumentAccepted,
  isAgentDocumentInReviewStage,
} from "@/lib/agents/agent-documents";
import {
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type {
  AgentTask,
  AgentTaskDecisionStatus,
  AgentTaskOutputStatus,
  AgentTaskStatus,
} from "@/lib/types";

export const AGENT_TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const;

export function parseAgentTaskStatus(
  value: unknown,
): AgentTaskDecisionStatus | null {
  if (value === "pending" || value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function getAgentTaskDecisionStatus(
  task: AgentTask,
): AgentTaskDecisionStatus {
  return task.status ?? "pending";
}

export function getAgentTaskStatus(task: AgentTask): AgentTaskStatus {
  const decision = getAgentTaskDecisionStatus(task);

  if (
    decision === "accepted" &&
    task.outputDocumentStatus &&
    isAgentDocumentAccepted(task.outputDocumentStatus)
  ) {
    return "completed";
  }

  if (
    decision === "accepted" &&
    task.outputDocumentStatus &&
    isAgentDocumentInReviewStage(task.outputDocumentStatus)
  ) {
    return "in_review";
  }

  return decision;
}

export function isAgentTaskPending(task: AgentTask): boolean {
  return getAgentTaskDecisionStatus(task) === "pending";
}

export function getAgentTaskStatusLabel(status: AgentTaskStatus): string {
  const match = AGENT_TASK_STATUS_OPTIONS.find(
    (option) => option.value === status,
  );
  return match?.label ?? status;
}

export function getAgentTaskStatusBadgeClassName(
  status: AgentTaskStatus,
): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "in_review":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    case "rejected":
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
}

export function getAcceptedAgentTasks(tasks: AgentTask[]): AgentTask[] {
  return tasks.filter(
    (task) => getAgentTaskDecisionStatus(task) === "accepted",
  );
}

export function getAgentTaskGenerationSlots(tasks: AgentTask[]): number {
  return AGENT_TASK_COUNT - getAcceptedAgentTasks(tasks).length;
}

export function canGenerateAgentTasks(tasks: AgentTask[]): boolean {
  return getAgentTaskGenerationSlots(tasks) > 0;
}

export function canAcceptAgentTask(
  tasks: AgentTask[],
  taskTitle: string,
): boolean {
  const task = tasks.find((item) => item.title === taskTitle);

  if (!task) {
    return false;
  }

  if (getAgentTaskDecisionStatus(task) === "accepted") {
    return true;
  }

  return getAcceptedAgentTasks(tasks).length < AGENT_TASK_COUNT;
}

export function getAgentTaskProjectBadgeClassName(): string {
  return "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200";
}

export function getAgentTaskProjectName(
  task: AgentTask,
  fallbackProjectName?: string | null,
): string | null {
  const projectName = task.projectName?.trim() || fallbackProjectName?.trim();
  return projectName || null;
}

export function normalizeAgentTasksProjectName(
  tasks: AgentTask[],
  projectName: string,
): AgentTask[] {
  const trimmedProjectName = projectName.trim();

  return tasks.map((task) => ({
    ...task,
    projectName: trimmedProjectName,
  }));
}

export function canAccessAgentTaskOutputTabs(task: AgentTask): boolean {
  return getAgentTaskDecisionStatus(task) === "accepted";
}

export function getAgentTaskOutputStatus(
  task: AgentTask,
): AgentTaskOutputStatus {
  return task.outputStatus ?? "not_started";
}

export function getAgentTaskOutputModelId(task: AgentTask): ChatModelId {
  return normalizeChatModelId(task.outputModelId);
}

export function hasAgentTaskOutput(task: AgentTask): boolean {
  return getAgentTaskOutputStatus(task) === "completed";
}

export function canReviewAgentTaskDeliverable(task: AgentTask): boolean {
  const documentStatus = task.outputDocumentStatus;

  if (!documentStatus) {
    return false;
  }

  return (
    getAgentTaskDecisionStatus(task) === "accepted" &&
    hasAgentTaskOutput(task) &&
    Boolean(task.outputDocumentId) &&
    isAgentDocumentInReviewStage(documentStatus)
  );
}

export function canMarkAgentTaskComplete(task: AgentTask): boolean {
  return canReviewAgentTaskDeliverable(task);
}

export function canRejectAgentTaskDeliverable(task: AgentTask): boolean {
  return canReviewAgentTaskDeliverable(task);
}

export function mergeGeneratedAgentTasks(
  existingTasks: AgentTask[],
  generatedTasks: AgentTask[],
): AgentTask[] {
  const acceptedTasks = getAcceptedAgentTasks(existingTasks);

  return [
    ...acceptedTasks,
    ...generatedTasks.map((task) => ({ ...task, status: "pending" as const })),
  ];
}

export function canReplaceAgentTask(
  tasks: AgentTask[],
  taskTitle: string,
): boolean {
  const task = tasks.find((item) => item.title === taskTitle);

  if (!task) {
    return false;
  }

  return getAgentTaskDecisionStatus(task) !== "accepted";
}

export function replaceGeneratedAgentTask(
  existingTasks: AgentTask[],
  taskTitle: string,
  generatedTask: AgentTask,
): AgentTask[] {
  const taskIndex = existingTasks.findIndex((item) => item.title === taskTitle);

  if (taskIndex === -1) {
    throw new Error("Task not found");
  }

  const updatedTasks = [...existingTasks];
  updatedTasks[taskIndex] = { ...generatedTask, status: "pending" as const };

  return updatedTasks;
}
