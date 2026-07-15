import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";
import { getChatTeammate } from "@/lib/chats/chat-teammates";

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

function formatOtherTeammateChatSummary(
  chat: TeammateChatSummary,
  index: number,
): string {
  const teammate = getChatTeammate(chat.teammateId);
  const title = chat.title.trim() || "Untitled chat";
  const sections = [
    `${index + 1}. ${teammate.name} (${teammate.role}) — Chat "${title}" (last updated ${chat.updatedAt})`,
  ];

  if (chat.project) {
    sections.push(formatProjectContext(chat.project));
  }

  sections.push(`Conversation summary:\n${chat.summary}`);

  return sections.join("\n");
}

export function buildOtherTeammatesContext(
  summaries: TeammateChatSummary[],
): string | null {
  if (summaries.length === 0) {
    return null;
  }

  return [
    "Recent conversations your other AI teammates have had with this user (most recently updated first):",
    summaries.map(formatOtherTeammateChatSummary).join("\n\n"),
  ].join("\n");
}
