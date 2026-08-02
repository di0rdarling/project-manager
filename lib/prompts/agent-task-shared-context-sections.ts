import { getAiRequestDateTime } from "@/lib/prompts/ai-datetime-context";
import { formatChatSummaries } from "@/lib/prompts/agent-memory-prompt";
import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";

export type AgentTaskSharedContextInput = {
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string | null;
  existingOverviewContext?: string | null;
  agentTasksDocumentsContext?: string | null;
  generatedAt?: Date;
  conversationIntro?: string;
  emptyConversationMessage?: string;
  overviewIntro?: string;
};

export function appendAgentTaskSupplementalContextSections(
  sections: string[],
  {
    agentNotesContext,
    existingOverviewContext,
    agentTasksDocumentsContext,
    overviewIntro = "What you already know about your shared work with this user, from your profile Overview (most recently and stable context) — stay consistent with this, do not contradict or repeat it:",
  }: Pick<
    AgentTaskSharedContextInput,
    | "agentNotesContext"
    | "existingOverviewContext"
    | "agentTasksDocumentsContext"
    | "overviewIntro"
  >,
): void {
  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  if (existingOverviewContext?.trim()) {
    sections.push("", overviewIntro, existingOverviewContext.trim());
  }

  if (agentTasksDocumentsContext?.trim()) {
    sections.push(
      "",
      "### Your tasks and deliverables",
      "",
      agentTasksDocumentsContext.trim(),
    );
  }
}

export function buildAgentTaskConversationHistorySection({
  chatSummaries,
  generatedAt,
  conversationIntro = "Recent conversations with this teammate about this project:",
  emptyConversationMessage = "No prior conversations with this teammate about this project yet.",
}: Pick<
  AgentTaskSharedContextInput,
  | "chatSummaries"
  | "generatedAt"
  | "conversationIntro"
  | "emptyConversationMessage"
>): string {
  const requestedAt = getAiRequestDateTime(generatedAt);

  if (chatSummaries.length === 0) {
    return emptyConversationMessage;
  }

  return [conversationIntro, formatChatSummaries(chatSummaries, requestedAt)].join(
    "\n",
  );
}

export function appendAgentTaskConversationHistorySection(
  sections: string[],
  input: AgentTaskSharedContextInput,
): void {
  sections.push(
    "",
    "---",
    "",
    "### Conversation history",
    "",
    buildAgentTaskConversationHistorySection(input),
  );
}
