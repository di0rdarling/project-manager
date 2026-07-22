import type { AgentTask, AgentTaskOutputFormat } from "@/lib/types";

export const AGENT_TASK_COUNT = 3;

/**
 * Minimum character counts for the persuasive/explanatory fields. Guards
 * against the model collapsing back to one-liners: rationale needs enough
 * room to build a real case (evidence + tie to project goal + preempted
 * objection), while impact/risk need enough room to be concrete rather than
 * generic. Tasks that don't clear these are dropped, which fails generation
 * and surfaces as a retryable error rather than silently shipping sparse
 * output.
 */
const MIN_RATIONALE_LENGTH = 200;
const MIN_IMPACT_LENGTH = 80;
const MIN_RISK_IF_SKIPPED_LENGTH = 80;

const VALID_OUTPUT_FORMATS: readonly AgentTaskOutputFormat[] = [
  "note",
  "document",
];

function parseOutputFormat(value: unknown): AgentTaskOutputFormat {
  return typeof value === "string" &&
    VALID_OUTPUT_FORMATS.includes(value as AgentTaskOutputFormat)
    ? (value as AgentTaskOutputFormat)
    : "note";
}

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

function projectNamesMatch(expected: string, actual: string): boolean {
  return (
    expected.trim().toLocaleLowerCase() === actual.trim().toLocaleLowerCase()
  );
}

export function parseAgentTasksJson(
  raw: string,
  expectedCount: number = AGENT_TASK_COUNT,
  expectedProjectName?: string,
): AgentTasksDraft {
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
          rationale: asTrimmedString(item.rationale),
          impact: asTrimmedString(item.impact),
          riskIfSkipped: asTrimmedString(item.risk_if_skipped),
          outputFormat: parseOutputFormat(item.output_format),
          outputDescription: asTrimmedString(item.output_description),
          projectName: asTrimmedString(item.project_name),
        }))
        .filter(
          (task) =>
            task.title.length > 0 &&
            task.detail.length > 0 &&
            task.rationale.length >= MIN_RATIONALE_LENGTH &&
            task.impact.length >= MIN_IMPACT_LENGTH &&
            task.riskIfSkipped.length >= MIN_RISK_IF_SKIPPED_LENGTH &&
            task.outputDescription.length > 0 &&
            (!expectedProjectName ||
              (task.projectName.length > 0 &&
                projectNamesMatch(expectedProjectName, task.projectName))),
        )
    : [];

  if (tasks.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} tasks, received ${tasks.length}`,
    );
  }

  return { tasks };
}
