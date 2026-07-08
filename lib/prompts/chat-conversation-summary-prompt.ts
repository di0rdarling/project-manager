import { PRESERVE_DETAIL_STYLE_GUIDE } from "@/lib/prompts/style-guide";

export type ConversationSummaryMessage = {
  role: "user" | "model";
  content: string;
};

/**
 * Number of most-recent raw messages sent verbatim when updating a chat's
 * running summary. Anything older than this window is represented only via
 * the existing stored summary, so the per-message cost of keeping the
 * summary fresh stays roughly constant instead of growing with the length
 * of the whole chat.
 */
export const RECENT_MESSAGE_WINDOW = 20;

type BuildChatConversationSummaryPromptInput = {
  chatTitle: string;
  /**
   * The existing summary covering everything before `recentMessages`.
   * Pass null when `recentMessages` already contains the entire
   * conversation (i.e. nothing has been truncated).
   */
  olderSummary: string | null;
  recentMessages: ConversationSummaryMessage[];
};

export function formatTranscript(
  messages: ConversationSummaryMessage[],
): string {
  return messages
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${message.content.trim()}`;
    })
    .join("\n\n");
}

export function buildChatConversationSummaryPrompt({
  chatTitle,
  olderSummary,
  recentMessages,
}: BuildChatConversationSummaryPromptInput): string {
  const trimmedOlderSummary = olderSummary?.trim() || null;

  const sections = [
    "You maintain a detailed running summary of an AI chat conversation.",
    "Write a summary that fully captures everything discussed, as if for someone who needs to act on this conversation later without having read it themselves.",
    "Cover every distinct topic raised in the conversation, in the order they came up.",
    "For each topic, capture: the specific options or approaches considered, the conclusion or decision that was reached and why, any concrete facts, numbers, or names involved, and anything left unresolved or open.",
    "Write as many paragraphs as needed to cover the whole conversation in full. Do not compress multiple distinct topics into one vague paragraph, and do not drop detail purely to keep the summary short.",
    "Use clear plain text with no markdown or bullet lists.",
    ...PRESERVE_DETAIL_STYLE_GUIDE,
    "",
    `Chat Title: ${chatTitle.trim() || "Untitled chat"}`,
  ];

  if (trimmedOlderSummary) {
    sections.push(
      "",
      "Below is the existing summary of the earlier part of this conversation, followed by the most recent messages (the earlier raw messages are no longer available, only this summary of them).",
      "Carry forward every detail from the existing summary that is still accurate — do not paraphrase away, generalize, or drop specifics that are already captured correctly in it.",
      "Then extend it with the full detail from the recent messages below, written with the same level of technical detail as the existing summary.",
      "",
      "Existing Summary (covers everything before the recent messages):",
      trimmedOlderSummary,
      "",
      "Recent Messages:",
      formatTranscript(recentMessages),
    );
  } else {
    sections.push("", "Full Transcript:", formatTranscript(recentMessages));
  }

  sections.push("", "Return only the updated summary.");

  return sections.join("\n");
}
