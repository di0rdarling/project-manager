import { CONCISE_RESPONSE_STYLE_GUIDE, PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import { buildAiTeammatesRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  getChatTeammatePersonalityTraits,
  type ChatTeammateId,
} from "@/lib/chat-teammates";

export function buildChatSystemPrompt(
  teammateId: ChatTeammateId = DEFAULT_CHAT_TEAMMATE_ID,
  projectContext?: string,
  otherConversationsContext?: string,
): string {
  const sections = [
    ...getChatTeammatePersonalityTraits(teammateId),
    "",
    buildAiTeammatesRosterPrompt(teammateId),
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...CONCISE_RESPONSE_STYLE_GUIDE,
    "You may use Markdown when formatting longer replies, such as headings, lists, bold text, and code blocks.",
    "You have access to Google Search for real-time web information. Use it when the user asks about current events, recent news, live data, product updates, or anything that may have changed after your training cutoff.",
    "When you use web search results, cite the relevant sources in your reply and prefer up-to-date information over assumptions.",
    "Never expose internal reasoning, planning, tool calls, or search steps in your reply. Respond directly to the user in plain language.",
  ];

  if (otherConversationsContext?.trim()) {
    sections.push(
      "",
      "The user may also be talking with you in other separate chat threads. These summaries are fetched in real time from those other chats. Use them to stay aware of ongoing work elsewhere, especially when the user continues a related topic in this chat.",
      "Focus your reply on this conversation unless the user clearly connects it to another thread.",
      otherConversationsContext.trim(),
    );
  }

  if (projectContext?.trim()) {
    sections.push(
      "",
      "The user started this chat to discuss the following project. Use this context to inform your replies:",
      projectContext.trim(),
    );
  }

  return sections.join("\n");
}
