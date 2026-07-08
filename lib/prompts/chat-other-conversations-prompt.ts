import type { TeammateChatSummary } from "@/lib/chat-summaries";

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

function formatChatSummary(chat: TeammateChatSummary, index: number): string {
  const title = chat.title.trim() || "Untitled chat";
  const sections = [
    `${index + 1}. Chat "${title}" (created ${chat.createdAt}, last updated ${chat.updatedAt})`,
  ];

  if (chat.project) {
    sections.push(formatProjectContext(chat.project));
  }

  sections.push(`Conversation summary:\n${chat.summary}`);

  return sections.join("\n");
}

export function buildChatOtherConversationsContext(
  summaries: TeammateChatSummary[],
): string | null {
  if (summaries.length === 0) {
    return null;
  }

  const sections = [
    "Other ongoing conversations with this user:",
    summaries.map(formatChatSummary).join("\n\n"),
  ];

  return sections.join("\n");
}
