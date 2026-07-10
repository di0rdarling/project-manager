import {
  formatDisplayDateTime,
  getRelativeDayLabel,
} from "@/lib/dates";
import { buildAiTeammatesMemoryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import { PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import type { TeammateChatSummary } from "@/lib/chat-summaries";

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

function formatChatSummaries(
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
    "Write a compact first-person Memory the user can read on your profile, and that other AI teammates can use as background about what you and the user have already covered.",
    'Use "I" throughout. Never refer to yourself in the third person.',
    "This is NOT a full retelling of every chat. Chat-level conversation summaries already keep the detailed per-thread record.",
    "Keep only durable, useful information:",
    "- Decisions the user made (and why, when known)",
    "- Preferences, constraints, and non-negotiables",
    "- Concrete tech/tool/product choices by name",
    "- Open loops, blockers, and unfinished next steps",
    "- Stable facts the user should not have to repeat",
    "Skip ephemeral chit-chat, turn-by-turn narration, greetings, closings, and role boilerplate.",
    "Do not invent details. Do not pad with filler.",
    "If a source mentions work the user did with a different named teammate, keep that attribution — do not claim it as your own firsthand experience.",
    "Write clear plain text with short paragraphs (or short lines). No markdown, no bullet symbols, no numbered lists.",
    `Hard limit: stay under roughly ${AGENT_MEMORY_MAX_CHARS} characters. If you would exceed that, drop the least durable or oldest items first and keep the highest-signal facts.`,
    "Near the end, briefly signal what is most recent so recency is obvious.",
    ...PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE,
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
  userName,
  generatedAt = new Date(),
}: BuildAgentMemoryPromptInput): string {
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());

  return [
    ...buildSharedMemoryInstructions(agentName, agentRole),
    `You are writing this memory at: ${currentDateTime}.`,
    "",
    buildChatUserContextPrompt(userName),
    "",
    buildAiTeammatesMemoryRosterPrompt(teammateId),
    "",
    "Synthesize one compact Memory from the conversation summaries below.",
    "Merge overlapping topics across chats. Do not write one paragraph per chat.",
    "Cover every chat only to the extent it contributes durable facts — omit chats that add nothing lasting.",
    "",
    "Past conversations:",
    formatChatSummaries(chatSummaries, generatedAt),
    "",
    `Return only ${agentName}'s compact first-person Memory.`,
  ].join("\n");
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
    "",
    "Update your Memory by folding in only the durable new information from the latest conversation summary below.",
    "If the existing Memory is long, narrative, or essay-like, rewrite it into the compact key-facts style while preserving still-true durable items.",
    "Remove items that the new summary clearly supersedes. Do not grow the Memory just because there is more text available.",
    "If the new summary adds nothing durable beyond what is already remembered, return the existing Memory largely unchanged (still in compact form).",
    "",
  ];

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
    `Return only ${agentName}'s updated compact first-person Memory.`,
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
