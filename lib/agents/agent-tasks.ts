import { AGENT_TASK_COUNT } from "@/lib/agents/agent-tasks-json";
import type { AgentTask, AgentTaskStatus } from "@/lib/types";

export const AGENT_TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export function parseAgentTaskStatus(value: unknown): AgentTaskStatus | null {
  if (value === "pending" || value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function getAgentTaskStatus(task: AgentTask): AgentTaskStatus {
  return task.status ?? "pending";
}

export function isAgentTaskPending(task: AgentTask): boolean {
  return getAgentTaskStatus(task) === "pending";
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
    case "rejected":
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
}

export function getAcceptedAgentTasks(tasks: AgentTask[]): AgentTask[] {
  return tasks.filter((task) => getAgentTaskStatus(task) === "accepted");
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

  if (getAgentTaskStatus(task) === "accepted") {
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
  return getAgentTaskStatus(task) === "accepted";
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
