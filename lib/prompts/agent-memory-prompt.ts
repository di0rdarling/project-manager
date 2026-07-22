import {
  formatDisplayDateTime,
  getRelativeDayLabel,
} from "@/lib/dates";
import {
  buildAiTeammatesMemoryRosterPrompt,
} from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import {
  INTERNAL_ARTIFACT_STYLE_GUIDE,
  PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE,
} from "@/lib/prompts/style-guide";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";

/**
 * Soft upper bound for stored agent memory. Keeps cross-teammate prompt
 * context compact while still leaving room for durable decisions, prefs,
 * and open loops the user can read on the profile page.
 */
export const AGENT_MEMORY_MAX_CHARS = 2800;

type BuildAgentMemoryPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string | null;
  userName?: string | null;
  generatedAt?: Date;
};

type BuildAgentMemoryMergePromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  existingMemory: string | null;
  chatTitle: string;
  conversationSummary: string;
  projectName?: string | null;
  agentNotesContext?: string | null;
  userName?: string | null;
  generatedAt?: Date;
};

function formatRelativeDaySuffix(
  date: Date | string,
  referenceDate: Date,
): string {
  const label = getRelativeDayLabel(date, referenceDate);
  return label ? ` — ${label}` : "";
}

function formatProjectContext(
  project: NonNullable<TeammateChatSummary["project"]>,
): string {
  const sections = [
    `Project: ${project.name.trim() || "Untitled project"}`,
    `Description: ${project.description.trim() || "No description provided."}`,
  ];

  if (project.aiSummary?.trim()) {
    sections.push(`Project summary: ${project.aiSummary.trim()}`);
  }

  return sections.join("\n");
}

export function formatChatSummaries(
  chatSummaries: TeammateChatSummary[],
  generatedAt: Date,
): string {
  const chronological = [...chatSummaries].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );

  return chronological
    .map((chat, index) => {
      const title = chat.title.trim() || "Untitled chat";
      const isMostRecent = index === chronological.length - 1;
      const recencyLabel = isMostRecent
        ? " — this is the most recent conversation of them all"
        : "";
      const sections = [
        `${index + 1}. Chat "${title}" (created ${formatDisplayDateTime(chat.createdAt)}${formatRelativeDaySuffix(chat.createdAt, generatedAt)}, last updated ${formatDisplayDateTime(chat.updatedAt)}${formatRelativeDaySuffix(chat.updatedAt, generatedAt)}${recencyLabel})`,
      ];

      if (chat.project) {
        sections.push(formatProjectContext(chat.project));
      } else {
        sections.push("Project: None linked to this chat");
      }

      sections.push(`Conversation summary:\n${chat.summary.trim()}`);

      return sections.join("\n");
    })
    .join("\n\n");
}

function buildSharedMemoryInstructions(
  agentName: string,
  agentRole: string,
): string[] {
  return [
    `You are ${agentName}, the ${agentRole}.`,
    "Write a compact first-person internal memory note. The user can read this on your profile; other AI teammates use it as background about what you and the user have already covered.",
    'Use "I" throughout. Never refer to yourself in the third person.',
    "This is NOT a full retelling of every chat. Chat-level conversation summaries already keep the detailed per-thread record.",
    "Keep only durable, useful information:",
    "- Decisions the user made (and why, when known)",
    "- The user's current direction and reasoning: what they're optimizing for, what concerns or trade-offs are shaping their choices, and how their thinking has evolved — not just the end decisions",
    "- Preferences, constraints, and non-negotiables",
    "- Concrete tech/tool/product choices by name",
    "- Open loops, blockers, and unfinished next steps",
    "- Stable facts the user should not have to repeat",
    "Capturing trajectory is what makes this memory feel like continuity rather than a lookup table: remembering that MongoDB was chosen after being torn on Postgres, with schema flexibility during early iteration as the deciding factor, is far more useful than just remembering \"chose MongoDB.\" Note when a decision was provisional or worth revisiting if circumstances change.",
    `Filter for what matters to your role as ${agentRole}: prioritize the facts, decisions, and open items that you specifically would need to do your job well. Another teammate will remember the rest through their own lens.`,
    "Names, numbers, identifiers, version strings, URLs, hex codes, and exact technical terms must be carried forward character-for-character. Never paraphrase them (e.g. never turn \"#7C3AED\" into \"a purple shade\").",
    "When noting an open loop or unfinished item, include roughly when it arose (e.g. \"since early July\") so staleness is visible later.",
    "Skip ephemeral chit-chat, turn-by-turn narration, greetings, closings, and role boilerplate.",
    "Do not invent details. Do not pad with filler.",
    "If a source mentions work the user did with a different named teammate, keep that attribution — do not claim it as your own firsthand experience.",
    `Hard limit: stay under roughly ${AGENT_MEMORY_MAX_CHARS} characters. When cutting for length, protect open loops, unresolved decisions, and the user's current direction first; drop resolved narrative and superseded details before dropping anything still open or active.`,
    "End the memory with a single line beginning \"Most recently:\" that summarizes the latest active thread in one sentence.",
    ...PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE,
    ...INTERNAL_ARTIFACT_STYLE_GUIDE,
  ];
}

/**
 * Full rebuild from all of this teammate's chat summaries.
 * Used for manual Generate / Regenerate on the agent profile.
 */
export function buildAgentMemoryPrompt({
  teammateId,
  agentName,
  agentRole,
  chatSummaries,
  agentNotesContext,
  userName,
  generatedAt = new Date(),
}: BuildAgentMemoryPromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());

  const sections = [
    ...buildSharedMemoryInstructions(agentName, agentRole),
    `You are writing this memory at: ${currentDateTime}.`,
    "",
    buildChatUserContextPrompt(userName),
    "",
    buildAiTeammatesMemoryRosterPrompt(teammateId),
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  sections.push(
    "",
    "Synthesize one compact Memory from the conversation summaries below.",
    "Merge overlapping topics across chats. Do not write one paragraph per chat.",
    "Cover every chat only to the extent it contributes durable facts — omit chats that add nothing lasting.",
    "When chats compete for space, weight recent conversations and still-open items above older, fully resolved material.",
    "",
    "Past conversations:",
    formatChatSummaries(chatSummaries, generatedAt),
    "",
    "Return only the compact memory note. No preamble, no sign-off, no self-introduction.",
  );

  return sections.join("\n");
}

/**
 * Cheap incremental update: fold one chat's latest summary into the
 * existing profile memory. Used automatically after each message turn
 * once the chat conversation summary has been refreshed.
 */
export function buildAgentMemoryMergePrompt({
  teammateId,
  agentName,
  agentRole,
  existingMemory,
  chatTitle,
  conversationSummary,
  projectName,
  agentNotesContext,
  userName,
  generatedAt = new Date(),
}: BuildAgentMemoryMergePromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());
  const trimmedExisting = existingMemory?.trim() || null;
  const projectLine = projectName?.trim()
    ? `Project: ${projectName.trim()}`
    : "Project: None linked to this chat";

  const sections = [
    ...buildSharedMemoryInstructions(agentName, agentRole),
    `You are updating this memory at: ${currentDateTime}.`,
    "",
    buildChatUserContextPrompt(userName),
    "",
    buildAiTeammatesMemoryRosterPrompt(teammateId),
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  sections.push(
    "",
    "Update your Memory by folding in only the durable new information from the latest conversation summary below.",
    "Your default action is to append new durable facts or make minimal edits to existing ones. Rewriting or restructuring the whole memory is the exception, not the norm.",
    `Only restructure the existing memory if it is close to the ${AGENT_MEMORY_MAX_CHARS}-character limit, or if it clearly contradicts the new information. Otherwise leave existing wording intact.`,
    "Every existing fact you drop must be either directly superseded by newer information or clearly lower-value than what replaces it. Never drop or reword an existing fact purely for style, flow, or brevity when there is room to keep it.",
    "Remove items that the new summary clearly supersedes. Do not grow the Memory just because there is more text available.",
    "If the new summary adds nothing durable beyond what is already remembered, return the existing Memory unchanged apart from updating the \"Most recently:\" line.",
    "",
  );

  if (trimmedExisting) {
    sections.push("Existing Memory:", trimmedExisting, "");
  } else {
    sections.push(
      "Existing Memory: (none yet — create the first compact Memory from the conversation summary below.)",
      "",
    );
  }

  sections.push(
    "Latest conversation to merge:",
    `Chat title: ${chatTitle.trim() || "Untitled chat"}`,
    projectLine,
    "Conversation summary:",
    conversationSummary.trim(),
    "",
    "Return only the updated compact memory note. No preamble, no sign-off, no self-introduction.",
  );

  return sections.join("\n");
}

/**
 * Safety net if the model exceeds the soft limit. Prefers cutting on a
 * paragraph or sentence boundary so the stored text stays readable.
 */
export function clampAgentMemory(memory: string): string {
  const trimmed = memory.trim();

  if (trimmed.length <= AGENT_MEMORY_MAX_CHARS) {
    return trimmed;
  }

  const slice = trimmed.slice(0, AGENT_MEMORY_MAX_CHARS);
  const paragraphBreak = slice.lastIndexOf("\n\n");
  const sentenceBreak = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );

  if (paragraphBreak >= AGENT_MEMORY_MAX_CHARS * 0.6) {
    return slice.slice(0, paragraphBreak).trim();
  }

  if (sentenceBreak >= AGENT_MEMORY_MAX_CHARS * 0.6) {
    return slice.slice(0, sentenceBreak + 1).trim();
  }

  return slice.trim();
}
