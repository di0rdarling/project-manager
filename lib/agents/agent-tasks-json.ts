import type { AgentTask } from "@/lib/types";

export const AGENT_TASK_COUNT = 3;

export type AgentTasksDraft = {
  tasks: AgentTask[];
};

export const EMPTY_AGENT_TASKS_DRAFT: AgentTasksDraft = {
  tasks: [],
};

function stripJsonFencing(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseAgentTasksJson(raw: string): AgentTasksDraft {
  const parsed = JSON.parse(stripJsonFencing(raw));
  const record = asRecord(parsed);

  if (!record) {
    throw new Error("Gemini returned a non-object agent tasks payload");
  }

  const tasksRaw = record.tasks;
  const tasks: AgentTask[] = Array.isArray(tasksRaw)
    ? tasksRaw
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => item !== null)
        .map((item) => ({
          title: asTrimmedString(item.title),
          detail: asTrimmedString(item.detail),
        }))
        .filter((task) => task.title.length > 0 && task.detail.length > 0)
    : [];

  if (tasks.length !== AGENT_TASK_COUNT) {
    throw new Error(
      `Expected ${AGENT_TASK_COUNT} tasks, received ${tasks.length}`,
    );
  }

  return { tasks };
}
