import { CONCISE_RESPONSE_STYLE_GUIDE, CONTEXT_GROUNDING_STYLE_GUIDE, PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import { buildAiTeammatesRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { buildChatUserContextPrompt } from "@/lib/prompts/chat-user-context-prompt";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  getChatTeammatePersonalityTraits,
  isCrossProjectTeammate,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";

export function buildChatSystemPrompt(
  teammateId: ChatTeammateId = DEFAULT_CHAT_TEAMMATE_ID,
  projectContext?: string,
  otherConversationsContext?: string,
  otherTeammatesContext?: string,
  agentNotesContext?: string,
  userName?: string | null,
): string {
  const sections = [
    buildAiTeammatesRosterPrompt(teammateId),
    "",
    buildChatUserContextPrompt(userName),
    ...getChatTeammatePersonalityTraits(teammateId),
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    ...CONCISE_RESPONSE_STYLE_GUIDE,
    ...CONTEXT_GROUNDING_STYLE_GUIDE,
    "You may use Markdown when formatting longer replies, such as headings, lists, bold text, and code blocks.",
    "You have access to Google Search for real-time web information. Use it when the user asks about current events, recent news, live data, product updates, or anything that may have changed after your training cutoff.",
    "When you use web search results, cite the relevant sources in your reply and prefer up-to-date information over assumptions.",
    "Never expose internal reasoning, planning, tool calls, or search steps in your reply. Respond directly to the user in plain language.",
  ];

  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  if (otherConversationsContext?.trim()) {
    sections.push(
      "",
      "The user may also be talking with you in other separate chat threads. These summaries are fetched in real time from those other chats. Use them to stay aware of ongoing work elsewhere, especially when the user continues a related topic in this chat.",
      "Focus your reply on this conversation unless the user clearly connects it to another thread.",
      otherConversationsContext.trim(),
    );
  }

  if (otherTeammatesContext?.trim()) {
    sections.push(
      "",
      "You are also automatically kept aware of what your other AI teammates have recently discussed with the user — you don't need to be told directly; treat it the way a colleague on the same team would naturally know what others have been working on with the user.",
      "Below are the most recently updated conversation summaries from their active chats — not full transcripts, but fresher than a compact profile memory would be. They are sorted by last activity across all teammates.",
      "Use this to avoid making the user repeat context they've already shared elsewhere, and to naturally build on relevant work happening with another teammate when it's genuinely relevant here.",
      "CRITICAL — attribution: this information belongs to another teammate's conversations, not yours. If you reference it, always phrase it the way a colleague naturally would — e.g. \"I know you and Nova have been working on positioning\" or \"as you discussed with Nova\" — explicitly naming them every time. Never phrase it as something you personally discussed, decided, or remember firsthand, and never fold it into your own recollection of this or other chats — that would misrepresent whose conversation it actually was.",
      "Don't invent details beyond what's summarized below, and if it's not relevant to the current message, don't bring it up at all.",
      otherTeammatesContext.trim(),
    );
  }

  if (projectContext?.trim()) {
    if (isCrossProjectTeammate(teammateId)) {
      sections.push(
        "",
        "You have visibility across all of the user's projects. Use this cross-project context — notes, requirements, domain knowledge, and project details — to inform your replies:",
        projectContext.trim(),
      );
    } else {
      sections.push(
        "",
        "The user started this chat to discuss the following project. Use this context to inform your replies:",
        projectContext.trim(),
      );
    }
  }

  return sections.join("\n");
}
