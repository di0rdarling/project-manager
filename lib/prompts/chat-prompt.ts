import { CONCISE_RESPONSE_STYLE_GUIDE, PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";

export function buildChatSystemPrompt(): string {
  const sections = [
    "You are a helpful AI assistant in a project management app.",
    "Help the user think through projects, tasks, decisions, and any questions they bring to the conversation.",
    "Be practical, clear, and supportive.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...CONCISE_RESPONSE_STYLE_GUIDE,
    "You may use Markdown when formatting longer replies, such as headings, lists, bold text, and code blocks.",
  ];

  return sections.join("\n");
}
