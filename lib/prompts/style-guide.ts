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
  "Default to brevity. When your role calls for depth — teaching, briefing, or critique — depth wins, but stay free of filler either way.",
];

/**
 * Rules for staying grounded in provided context during live chat replies.
 * Prevents proactive agents from inventing status, follow-ups, or project
 * details when summaries, memories, or project sections are sparse or empty.
 */
export const CONTEXT_GROUNDING_STYLE_GUIDE: readonly string[] = [
  "Only reference things that actually appear in your provided context — project details, conversation summaries, teammate memories, and notes.",
  "If nothing genuinely needs attention or the context is sparse, say so plainly rather than inventing something to discuss. \"Nothing urgent on my radar\" is a perfectly good answer.",
  "Never fabricate follow-ups, status updates, requirements, decisions, or project details to have something to say.",
  "When relevant project sections are empty (e.g. Requirements, Pain Points, Tools), name the gap and offer to build it out together — do not fill gaps with invented content.",
];

/**
 * Style guide for private internal artifacts an agent writes about its own
 * conversations — profile Memory, running conversation summaries, and
 * archived chat summaries. These are read by the agent itself, by other
 * teammates, or by the user browsing a profile — never by the user as a
 * live reply — so the model must never open by introducing itself,
 * narrating that it's writing a summary, or using markdown/bullets.
 *
 * This is the single place to fix the "I am Jordan" class of bug: every
 * prompt builder that produces one of these artifacts should spread this in
 * rather than repeating its own version of these rules.
 */
export const INTERNAL_ARTIFACT_STYLE_GUIDE: readonly string[] = [
  "This is a private internal artifact, not a message to the user. The reader already knows exactly who you are and what your role is.",
  "Never introduce yourself, state your name, or restate your role anywhere in the output.",
  "Never narrate the act of writing this artifact (e.g. \"In this summary I will cover...\", \"Here's what I remember...\", \"This note covers...\"). Do not describe what you are about to do — just do it.",
  "Begin directly with the substance — the first sentence should be about the user or the work, never about you.",
  'Bad opening: "I\'m Jordan, and this is my memory of..."',
  'Bad opening: "In this summary I\'ll cover the key decisions we made..."',
  'Good opening: "The user decided to use MongoDB for the ledger project because..."',
  "Write clear plain text with short paragraphs. No markdown, no bullet symbols, no numbered lists.",
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
