import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";

type BuildChatConversationSummaryPromptInput = {
  chatTitle: string;
  previousSummary: string | null;
  userMessage: string;
  assistantMessage: string;
};

export function buildChatConversationSummaryPrompt({
  chatTitle,
  previousSummary,
  userMessage,
  assistantMessage,
}: BuildChatConversationSummaryPromptInput): string {
  const sections = [
    "You maintain a running summary of an AI chat conversation.",
    "Update the summary so someone can quickly understand what has been discussed so far.",
    "Keep important context from earlier turns while reflecting the latest exchange.",
    "Write 2-4 short paragraphs covering key topics, decisions, questions, and open items.",
    "Use clear plain text with no markdown or bullet lists.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "",
    `Chat Title: ${chatTitle.trim() || "Untitled chat"}`,
  ];

  if (previousSummary?.trim()) {
    sections.push(
      "",
      "Previous Summary:",
      previousSummary.trim(),
    );
  }

  sections.push(
    "",
    "Latest Exchange:",
    `User: ${userMessage.trim()}`,
    `Assistant: ${assistantMessage.trim()}`,
    "",
    "Return only the updated running summary.",
  );

  return sections.join("\n");
}
