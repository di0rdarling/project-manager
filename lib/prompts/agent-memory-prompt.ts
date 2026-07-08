import {
  formatDisplayDateTime,
  getRelativeDayLabel,
} from "@/lib/dates";
import { buildAiTeammatesMemoryRosterPrompt } from "@/lib/prompts/ai-teammates-roster";
import { PRESERVE_DETAIL_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import type { TeammateChatSummary } from "@/lib/chat-summaries";

type BuildAgentMemoryPromptInput = {
  teammateId: ChatTeammateId;
  agentName: string;
  agentRole: string;
  agentDescription: string;
  chatSummaries: TeammateChatSummary[];
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
  // Oldest first, so the list reads as a timeline the model can narrate
  // in chronological order, with the true most-recent chat called out last.
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

export function buildAgentMemoryPrompt({
  teammateId,
  agentName,
  agentRole,
  agentDescription,
  chatSummaries,
  generatedAt = new Date(),
}: BuildAgentMemoryPromptInput): string {
  const roleForGreeting = agentRole.trim().toLowerCase().startsWith("your ")
    ? agentRole.trim().toLowerCase()
    : `your ${agentRole.trim().toLowerCase()}`;
  const currentDateTime = formatDisplayDateTime(generatedAt.toISOString());

  const sections = [
    `You are ${agentName}, the ${agentRole}.`,
    `The user is asking you what you remember from your past conversations with them right now.`,
    `You are responding at this moment: ${currentDateTime}. Treat this as the present — conversations marked "today" in the data below are happening on the current day, not in the past.`,
    "Write your response in the first person, as if you are speaking directly to the user.",
    'Use "I" throughout.',
    "Base your response only on the conversation summaries and project details below — do not invent or generalize away details that are present in them.",
    "When a chat was linked to a project, ground what you remember in that project's description and summary as well as the conversation.",
    "",
    buildAiTeammatesMemoryRosterPrompt(teammateId),
    "",
    "The conversations below are listed in chronological order (oldest to newest) by when they were last updated, and the most recent one is explicitly labeled.",
    "Use the timestamps to understand recency and sequence, but do not mechanically restate the full calendar date at the start of every paragraph — that reads as repetitive, especially when several conversations happened on the same day.",
    'For conversations marked "today", speak in the present: say "today", "earlier today", "we have been discussing", or "most recently" — do not refer to today\'s calendar date as if it were already behind you (avoid phrasing like "on July 8" or "back on July 8" when that date is today).',
    'For conversations marked "yesterday", you may say "yesterday". For older conversations, use the calendar date or a clear past reference.',
    "When two or more conversations happened on the same calendar date, mention that date at most once for that group (or say \"today\" once if they are all today), and distinguish the individual conversations using sequencing language instead, such as 'in one of those conversations', 'in another', 'we then moved on to', or 'right after that'.",
    "Only call out a specific date when it is genuinely useful context (for example, the very first conversation, a date that differs from the ones around it, or the single most recent conversation) — do not force a date into every paragraph.",
    "Make sure the user can tell what you discussed most recently. Near the end of the Memory section, clearly signal which topic came from your latest conversation, using language like 'most recently' or 'the last time we spoke'.",
    "",
    "Structure your response in three parts:",
    `1. Opening: Start with "Hey, I'm ${agentName}, and I'm ${roleForGreeting}."`,
    "2. Memory: Write one dedicated paragraph for every conversation summary listed below, covering it in full detail — the specific technologies, tools, or approaches discussed, the options considered, the decisions reached and why, concrete facts or numbers involved, and anything left open or unresolved. Do not merge multiple conversations into a single vague paragraph, and do not flatten technical detail into generic statements.",
    "3. Closing: End with one short paragraph that flows naturally from the Memory section — as if you are continuing the same conversation, not starting a sales pitch. Do not open with generic role boilerplate like \"I am here to help you...\" or restate your job description.",
    "In the Closing, focus on what comes next based on your most recent discussions: unfinished work, open questions, and concrete next steps the user could pick up with you. Lead with the specific topics, tools, or decisions from those conversations — especially the most recent one — rather than broad capabilities.",
    "Where the conversation summaries show unresolved items, mention them by name and invite the user to continue on those specific threads. You may briefly tie this back to how you can help, but only in terms of the actual work already in progress — not a general list of what your role covers.",
    `Use this role description only as background if it helps you frame a specific next step, not as the main content of the Closing: ${agentDescription.trim() || "No description provided."}`,
    "Write as many paragraphs as needed in the Memory section to cover every conversation listed below in full — do not shorten or compress the memory section for brevity.",
    "Use clear plain text with no markdown or bullet lists.",
    ...PRESERVE_DETAIL_STYLE_GUIDE,
    "",
    "Past conversations:",
    formatChatSummaries(chatSummaries, generatedAt),
    "",
    `Return only ${agentName}'s first-person response.`,
  ];

  return sections.join("\n");
}
