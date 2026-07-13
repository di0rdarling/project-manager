import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { buildAiTeammatesConversationSummaryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import {
  INTERNAL_ARTIFACT_STYLE_GUIDE,
  PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE,
} from "@/lib/prompts/style-guide";

/**
 * Soft upper bound for an archived chat's stored summary. Active chats keep
 * a longer running summary; archiving compresses it so many archived threads
 * do not bloat cross-chat agent context.
 */
export const ARCHIVED_CHAT_SUMMARY_MAX_CHARS = 1000;

type BuildChatArchiveSummaryPromptInput = {
  teammateId: ChatTeammateId;
  chatTitle: string;
  conversationSummary: string;
  userName?: string | null;
};

export function buildChatArchiveSummaryPrompt({
  teammateId,
  chatTitle,
  conversationSummary,
  userName,
}: BuildChatArchiveSummaryPromptInput): string {
  return [
    buildAiTeammatesConversationSummaryRosterPrompt(teammateId),
    "",
    buildChatUserContextPrompt(userName),
    "",
    "The user is archiving this chat. It will stay saved, but its running summary must be compressed into a compact archived memory for future AI context.",
    "You are not deleting anything — you are distilling what still matters after the conversation is done.",
    "",
    "Keep only durable, high-signal information:",
    "- Decisions the user made (and why, when known)",
    "- The user's current direction and reasoning: what they're optimizing for, what concerns or trade-offs are shaping their choices, and how their thinking has evolved — not just the end decisions",
    "- Preferences, constraints, and non-negotiables",
    "- Concrete tech, tool, product, or process choices by name",
    "- Open loops, blockers, and unfinished next steps the user may return to",
    "- Stable facts the user should not have to repeat",
    "",
    "Drop turn-by-turn narration, greetings, closings, repeated back-and-forth, and anything that no longer affects future work.",
    "Do not invent details. Do not pad with filler.",
    "If the source mentions work the user did with a different named teammate, keep that attribution — do not claim it as your own firsthand experience.",
    `Hard limit: stay under roughly ${ARCHIVED_CHAT_SUMMARY_MAX_CHARS} characters. If you would exceed that, drop the least durable or oldest items first and keep the highest-signal facts.`,
    ...PRESERVE_DETAIL_WITHIN_LIMIT_STYLE_GUIDE,
    ...INTERNAL_ARTIFACT_STYLE_GUIDE,
    "",
    `Chat Title: ${chatTitle.trim() || "Untitled chat"}`,
    "",
    "Running conversation summary to compress:",
    conversationSummary.trim(),
    "",
    "Return only the compressed archived summary, written entirely in the first person from your perspective. No preamble, no sign-off, no self-introduction.",
  ].join("\n");
}

/**
 * Safety net if the model exceeds the soft limit. Prefers cutting on a
 * paragraph or sentence boundary so the stored text stays readable.
 */
export function clampArchivedChatSummary(summary: string): string {
  const trimmed = summary.trim();

  if (trimmed.length <= ARCHIVED_CHAT_SUMMARY_MAX_CHARS) {
    return trimmed;
  }

  const slice = trimmed.slice(0, ARCHIVED_CHAT_SUMMARY_MAX_CHARS);
  const paragraphBreak = slice.lastIndexOf("\n\n");
  const sentenceBreak = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );

  if (paragraphBreak >= ARCHIVED_CHAT_SUMMARY_MAX_CHARS * 0.6) {
    return slice.slice(0, paragraphBreak).trim();
  }

  if (sentenceBreak >= ARCHIVED_CHAT_SUMMARY_MAX_CHARS * 0.6) {
    return slice.slice(0, sentenceBreak + 1).trim();
  }

  return slice.trim();
}
