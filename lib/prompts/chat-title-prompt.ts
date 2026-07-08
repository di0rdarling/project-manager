import {
  formatTranscript,
  type ConversationSummaryMessage,
} from "@/lib/prompts/chat-conversation-summary-prompt";

/**
 * Number of completed user/assistant turns after which a chat with no
 * user-set title override gets an AI-generated title, replacing the
 * placeholder title created from the first message.
 */
export const CHAT_TITLE_GENERATION_TURN_THRESHOLD = 3;

export function buildChatTitlePrompt(
  messages: ConversationSummaryMessage[],
): string {
  return [
    "You write short, descriptive titles for AI chat conversations.",
    "Read the conversation below and write a title that captures what it is actually about.",
    "The title must be plain text with no quotation marks, markdown, or trailing punctuation.",
    "Keep it concise: ideally 3 to 7 words, and no longer than 60 characters.",
    "",
    "Conversation:",
    formatTranscript(messages),
    "",
    "Return only the title, nothing else.",
  ].join("\n");
}
