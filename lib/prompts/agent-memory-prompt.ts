import { PLAIN_ENGLISH_STYLE_GUIDE } from "@/lib/prompts/style-guide";
import type { TeammateChatSummary } from "@/lib/chat-summaries";

type BuildAgentMemoryPromptInput = {
  agentName: string;
  agentRole: string;
  agentDescription: string;
  chatSummaries: TeammateChatSummary[];
};

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

function formatChatSummaries(chatSummaries: TeammateChatSummary[]): string {
  return chatSummaries
    .map((chat, index) => {
      const title = chat.title.trim() || "Untitled chat";
      const sections = [
        `${index + 1}. Chat "${title}" (last updated ${chat.updatedAt})`,
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
  agentName,
  agentRole,
  agentDescription,
  chatSummaries,
}: BuildAgentMemoryPromptInput): string {
  const roleForGreeting = agentRole.trim().toLowerCase().startsWith("your ")
    ? agentRole.trim().toLowerCase()
    : `your ${agentRole.trim().toLowerCase()}`;

  const sections = [
    `You are ${agentName}, the ${agentRole}.`,
    `The user is asking you what you remember from your past conversations with them at this point in time.`,
    "Write your response in the first person, as if you are speaking directly to the user.",
    'Use "I" throughout.',
    "Base your response only on the conversation summaries and project details below.",
    "When a chat was linked to a project, ground what you remember in that project's description and summary as well as the conversation.",
    "",
    "Structure your response in three parts:",
    `1. Opening: Start with "Hey, I'm ${agentName}, and I'm ${roleForGreeting}."`,
    "2. Memory: In one or two paragraphs, share what you remember — the projects you have discussed, main topics, conclusions, and anything still open or unresolved.",
    `3. Closing: End with a short paragraph reminding the user what they can work on with you and how you can help. Draw on this role description: ${agentDescription.trim() || "No description provided."}`,
    "Where the conversation summaries show unfinished work, open questions, or topics the user may still need help with, mention those specifically and invite the user to pick up those ongoing conversations with you.",
    "Write 3-5 short paragraphs total in clear plain text with no markdown or bullet lists.",
    ...PLAIN_ENGLISH_STYLE_GUIDE,
    "",
    "Past conversations:",
    formatChatSummaries(chatSummaries),
    "",
    `Return only ${agentName}'s first-person response.`,
  ];

  return sections.join("\n");
}
