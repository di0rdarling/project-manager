import type {
  UserMemoryDecision,
} from "@/lib/types";

/** Max stable-context items kept, matching the prompt's own instruction. */
const MAX_STABLE_CONTEXT_ITEMS = 4;

export type UserMemoryDraft = {
  mostRecently: string | null;
  decisions: UserMemoryDecision[];
  stableContext: string[];
};

export const EMPTY_USER_MEMORY_DRAFT: UserMemoryDraft = {
  mostRecently: null,
  decisions: [],
  stableContext: [],
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

/**
 * Parses and defensively sanitizes the model's JSON output — the model is
 * asked for exact field names, but responses still need validating (missing
 * fields, wrong types, invalid enum values) before being trusted as data.
 */
export function parseUserMemoryJson(raw: string): UserMemoryDraft {
  const parsed = JSON.parse(stripJsonFencing(raw));
  const record = asRecord(parsed);

  if (!record) {
    throw new Error("Gemini returned a non-object user memory payload");
  }

  const decisionsRaw = record.decisions;
  const decisions: UserMemoryDecision[] = Array.isArray(decisionsRaw)
    ? decisionsRaw
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => item !== null)
        .map((item) => ({
          topic: asTrimmedString(item.topic),
          choice: asTrimmedString(item.choice),
          project: asTrimmedString(item.project) || "General",
          when: asTrimmedString(item.when),
        }))
        .filter(
          (decision) => decision.topic.length > 0 && decision.choice.length > 0,
        )
    : [];

  const stableContextRaw = record.stable_context;
  const stableContext: string[] = Array.isArray(stableContextRaw)
    ? stableContextRaw
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .map((item) => item.trim())
        .slice(0, MAX_STABLE_CONTEXT_ITEMS)
    : [];

  const mostRecently = asTrimmedString(record.most_recently);

  return {
    mostRecently: mostRecently || null,
    decisions,
    stableContext,
  };
}

/**
 * Renders stored memory back into the same snake_case schema the model was
 * asked to produce, so the merge prompt can show it the exact shape it
 * should extend rather than a differently-cased internal representation.
 */
export function serializeUserMemoryForPrompt(draft: UserMemoryDraft): string {
  return JSON.stringify(
    {
      most_recently: draft.mostRecently ?? "",
      decisions: draft.decisions.map((decision) => ({
        topic: decision.topic,
        choice: decision.choice,
        project: decision.project,
        when: decision.when,
      })),
      stable_context: draft.stableContext,
    },
    null,
    2,
  );
}
