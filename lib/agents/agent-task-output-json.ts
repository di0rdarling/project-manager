const MIN_CONTENT_LENGTH = 40;
const MIN_APPROACH_LENGTH = 20;
const MIN_COMPLETION_SUMMARY_LENGTH = 20;

export type AgentTaskOutputDraft = {
  content: string;
  approach: string;
  completionSummary: string;
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

export function parseAgentTaskOutputJson(raw: string): AgentTaskOutputDraft {
  const parsed = JSON.parse(stripJsonFencing(raw));
  const record = asRecord(parsed);

  if (!record) {
    throw new Error("Gemini returned a non-object task output payload");
  }

  const content = asTrimmedString(record.content);
  const approach = asTrimmedString(record.approach);
  const completionSummary = asTrimmedString(record.completion_summary);

  if (
    content.length < MIN_CONTENT_LENGTH ||
    approach.length < MIN_APPROACH_LENGTH ||
    completionSummary.length < MIN_COMPLETION_SUMMARY_LENGTH
  ) {
    throw new Error("Gemini returned incomplete task output");
  }

  return { content, approach, completionSummary };
}
