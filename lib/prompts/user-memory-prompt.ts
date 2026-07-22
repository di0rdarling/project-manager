import { formatDisplayDateTime } from "@/lib/dates";
import { formatChatSummaries } from "@/lib/prompts/agent-memory-prompt";
import { buildAiTeammatesMemoryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";
import { serializeUserMemoryForPrompt, type UserMemoryDraft } from "@/lib/agents/user-memory-json";

const JSON_SCHEMA_BLOCK = `{
  "most_recently": string,
  "decisions": Decision[],
  "stable_context": string[]
}`;

const DECISION_SCHEMA_BLOCK = `{
  "topic": string,          // short noun phrase, e.g. "Monetisation model"
  "choice": string,         // what was decided, in plain language
  "project": string,
  "when": string            // approximate date or "this week" etc.
}`;

/** Field-by-field instructions shared by both the full rebuild and merge prompts. */
const FIELD_INSTRUCTIONS = [
  "### Field instructions",
  "",
  "**`most_recently`** — one sentence. The single most useful thing for {{userName}} to know right now as they return to this conversation. Should name a concrete next action or pending question, not just summarise a topic. This is the first thing they read.",
  "",
  "---",
  "",
  "**`decisions`** — array of Decision objects. Things that were explicitly decided and do not need to be revisited. Only include if the decision is durable and affects future work.",
  "",
  "Each Decision:",
  "```",
  DECISION_SCHEMA_BLOCK,
  "```",
  "",
  "---",
  "",
  "**`stable_context`** — array of short strings (1–2 sentences each). Facts about {{userName}}'s setup, constraints, or preferences that should not have to be repeated. Non-negotiables, paused work, environmental constraints. Maximum 4 items. Only include things that genuinely affect how work gets done.",
] as const;

function interpolateUserName(lines: readonly string[], userName: string): string {
  return lines.join("\n").replaceAll("{{userName}}", userName);
}

type BuildUserMemoryPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string | null;
  userName?: string | null;
  generatedAt?: Date;
};

/**
 * Full rebuild from this teammate's most recently updated chat summaries.
 * Used for manual Generate / Regenerate on the agent profile.
 */
export function buildUserMemoryPrompt({
  teammateId,
  agentName,
  agentRole,
  chatSummaries,
  agentNotesContext,
  userName,
  generatedAt = new Date(),
}: BuildUserMemoryPromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());
  const resolvedUserName = userName?.trim() || "the user";

  const sections = [
    `You are ${agentName}, the ${agentRole}.`,
    "",
    `You are generating a structured summary of your shared work with ${resolvedUserName} — not for yourself, but for them. They will read this on your profile page to quickly remember where things stand, what still needs their attention, and what has already been decided. Write it as if you are briefing them, not as if you are writing notes for yourself.`,
    "",
    `${resolvedUserName} has ADHD and context-switches frequently across multiple projects. Prioritise clarity over completeness. A short, accurate entry is better than a thorough one that blurs into the rest.`,
    "",
    buildChatUserContextPrompt(userName),
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  sections.push(
    "",
    "---",
    "",
    "Return a JSON object with exactly these fields. No preamble, no markdown fencing, no explanation — just the JSON object.",
    "",
    "```",
    JSON_SCHEMA_BLOCK,
    "```",
    "",
    "---",
    "",
    interpolateUserName(FIELD_INSTRUCTIONS, resolvedUserName),
    "",
    "---",
    "",
    "### Source material",
    "",
    "Most recent conversations (by last activity):",
    formatChatSummaries(chatSummaries, generatedAt),
    "",
    `You are generating this at: ${currentDateTime}.`,
    "",
    buildAiTeammatesMemoryRosterPrompt(teammateId),
    "",
    "---",
    "",
    "Return only the JSON object. No preamble, no sign-off.",
  );

  return sections.join("\n");
}

type BuildUserMemoryMergePromptInput = {
  agentName: string;
  agentRole: string;
  existingMemory: UserMemoryDraft | null;
  chatTitle: string;
  conversationSummary: string;
  projectName?: string | null;
  agentNotesContext?: string | null;
  userName?: string | null;
  generatedAt?: Date;
};

/**
 * Cheap incremental update: fold one chat's latest summary into the
 * existing structured user memory. Used automatically after each message
 * turn once the chat conversation summary has been refreshed.
 */
export function buildUserMemoryMergePrompt({
  agentName,
  agentRole,
  existingMemory,
  chatTitle,
  conversationSummary,
  projectName,
  agentNotesContext,
  userName,
  generatedAt = new Date(),
}: BuildUserMemoryMergePromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());
  const resolvedUserName = userName?.trim() || "the user";
  const projectLine = projectName?.trim()
    ? `Project: ${projectName.trim()}`
    : "Project: None linked to this chat";

  const sections = [
    `You are ${agentName}, the ${agentRole}.`,
    "",
    `You are updating a structured user-facing summary after a new conversation. ${resolvedUserName} uses this to track decisions and what needs their attention across all their projects.`,
    "",
    "Your job is to make the minimum necessary changes to the existing summary to reflect the new conversation. Do not rewrite what has not changed.",
    "",
    "Rules:",
    "- Update `most_recently` to reflect the new conversation's most actionable takeaway",
    "- Add new decisions to `decisions` if something was decided in this conversation",
    "- Update `stable_context` only if a constraint or fact genuinely changed",
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  sections.push(
    "",
    "Existing summary:",
    existingMemory
      ? serializeUserMemoryForPrompt(existingMemory)
      : "(none yet — create the first structured summary from the conversation below.)",
    "",
    "Latest conversation:",
    `Chat: ${chatTitle.trim() || "Untitled chat"}`,
    projectLine,
    "Summary:",
    conversationSummary.trim(),
    "",
    `Generated at: ${currentDateTime}`,
    "",
    "Return only the updated JSON object. No preamble, no explanation, no markdown fencing.",
  );

  return sections.join("\n");
}
