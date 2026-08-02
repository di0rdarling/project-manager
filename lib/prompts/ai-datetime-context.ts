import { formatDisplayDateTime } from "@/lib/dates";

/**
 * Central date/time helpers for every AI prompt in this app.
 *
 * All prompt builders under `lib/prompts/` must include `buildAiDateTimeContext()`
 * so models know the live request time. Pass the same `referenceDate` through
 * a route when you also persist `generatedAt` on the stored record.
 *
 * @see lib/prompts/style-guide.ts
 */

/** Reference instant for an AI request. Defaults to the current time. */
export function getAiRequestDateTime(referenceDate?: Date): Date {
  return referenceDate ?? new Date();
}

/** Human-readable date/time string for AI prompts. */
export function formatAiRequestDateTime(referenceDate?: Date): string {
  return formatDisplayDateTime(
    getAiRequestDateTime(referenceDate).toISOString(),
  );
}

/**
 * Standard prompt line for the current request time.
 * Include this in every AI feature's prompt (system or user).
 */
export function buildAiDateTimeContext(referenceDate?: Date): string {
  return `Current date and time: ${formatAiRequestDateTime(referenceDate)}.`;
}
