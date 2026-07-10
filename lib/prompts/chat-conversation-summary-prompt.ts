import type { ChatTeammateId } from "@/lib/chat-teammates";
import { buildAiTeammatesConversationSummaryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
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
  teammateId: ChatTeammateId;
  chatTitle: string;
  /**
   * The existing summary covering everything before `recentMessages`.
   * Pass null when `recentMessages` already contains the entire
   * conversation (i.e. nothing has been truncated).
   */
  olderSummary: string | null;
  recentMessages: ConversationSummaryMessage[];
  userName?: string | null;
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
  teammateId,
  chatTitle,
  olderSummary,
  recentMessages,
  userName,
}: BuildChatConversationSummaryPromptInput): string {
  const trimmedOlderSummary = olderSummary?.trim() || null;

  const sections = [
    buildAiTeammatesConversationSummaryRosterPrompt(teammateId),
    "",
    buildChatUserContextPrompt(userName),
    "",
    "Write a detailed running summary of this conversation from your own perspective, as your personal memory of what you and the user discussed.",
    "Write the summary so you (and your other chats with this user) can act on it later without re-reading the transcript.",
    "Cover every distinct useful topic raised in the conversation, in the order they came up.",
    "For each topic, capture: the specific options or approaches considered, the conclusion or decision that was reached and why, any concrete facts, numbers, or names involved, and anything left unresolved or open.",
    "Skip small talk, repeated acknowledgements, and process narration that does not change decisions, facts, or open loops.",
    "You may mention in this transcript things the user discussed with a different AI teammate (referred to by name, e.g. Nova, Sandy, Theo, Arlo, Jordan). Preserve that attribution exactly as given — describe it as something the user discussed with that named teammate, not as a topic that you decided or worked through in this conversation. Do not blend it into this chat's own topics or decisions.",
    "Be thorough on decisions, constraints, and open items. Do not merge distinct topics into one vague paragraph, and do not drop concrete detail to sound shorter — but do not pad with filler either.",
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
      'If the existing summary describes you in the third person (e.g. "The assistant suggested...", "Nova recommended...", or "The AI explained..."), rewrite those parts in the first person when you carry them forward (e.g. "I suggested...", "I recommended...", "I explained...").',
      "Then extend it with the full detail from the recent messages below, written with the same level of technical detail as the existing summary and always in the first person from your perspective.",
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

  sections.push(
    "",
    "Return only the updated summary, written entirely in the first person from your perspective.",
  );

  return sections.join("\n");
}
