/**
 * Shared writing-style instructions for AI-generated text across the app.
 *
 * Every prompt builder in `lib/prompts/` should spread this into its prompt
 * so that generated content (summaries, and any future AI features) stays
 * consistent, approachable, and easy to read for all users.
 *
 * Usage:
 *   const sections = [
 *     "You are a <role> assistant.",
 *     "Do <task-specific instruction>.",
 *     ...PLAIN_ENGLISH_STYLE_GUIDE,
 *     "",
 *     `Some Input: ${value}`,
 *   ];
 */
export const PLAIN_ENGLISH_STYLE_GUIDE: readonly string[] = [
  "Use simple, plain English that a high schooler could easily understand.",
  "Avoid jargon, buzzwords, and overly formal or corporate language.",
  "Prefer short sentences and everyday words over complex or technical ones.",
];
