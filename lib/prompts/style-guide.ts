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
  "Use simple, plain English that a late high schooler could easily understand.",
  "Avoid jargon, buzzwords, and overly formal or corporate language.",
  "Prefer short sentences and everyday words over complex or technical ones.",
];

export const CONCISE_RESPONSE_STYLE_GUIDE: readonly string[] = [
  "Be concise and to the point.",
  "Avoid unnecessary words and phrases.",
  "Prefer short sentences and everyday words over complex or technical ones.",
  "Keep responses brief and to the point.",
];

/**
 * Style guide for AI-generated text that is meant to be reused as context
 * (fed back into future prompts, other agents, or other systems) rather than
 * read once by a human. Unlike PLAIN_ENGLISH_STYLE_GUIDE, this guide favors
 * factual completeness and specificity over simplicity, since flattening
 * technical detail into "plain English" here means that detail is gone for
 * good the next time this text is used as context.
 */
export const PRESERVE_DETAIL_STYLE_GUIDE: readonly string[] = [
  "Preserve concrete technical details from the source material: names of tools, technologies, products, files, and systems; specific numbers; and the exact options that were considered.",
  "Do not generalize or simplify technical terms into vague descriptions. State the specific technologies and methods that were actually discussed, by name.",
  "Name the decision that was reached on each topic and the reasoning behind it, not just that 'a decision was made'.",
  "Write in clear, well-organized prose, but never sacrifice factual detail or specificity for the sake of brevity.",
];

/**
 * Like PRESERVE_DETAIL_STYLE_GUIDE, but for capped artifacts (e.g. agent
 * profile Memory) where a hard length limit means compression is required.
 */
export const PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE: readonly string[] = [
  "Preserve concrete technical details from the source material: names of tools, technologies, products, files, and systems; specific numbers; and the exact options that were considered.",
  "Do not generalize or simplify technical terms into vague descriptions. State the specific technologies and methods that were actually discussed, by name.",
  "Name the decision that was reached on each topic and the reasoning behind it, not just that 'a decision was made'.",
  "Prefer specific names and decisions over vague summaries, but stay within any stated length limit — drop lower-signal items before dropping concrete detail on what you keep.",
];
