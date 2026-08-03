import { getAiRequestDateTime } from "@/lib/prompts/ai-datetime-context";
import { formatChatSummaries } from "@/lib/prompts/agent-memory-prompt";
import type { TeammateChatSummary } from "@/lib/chats/chat-summaries";

export type AgentTaskSharedContextInput = {
  chatSummaries: TeammateChatSummary[];
  agentNotesContext?: string | null;
  agentMemoryContext?: string | null;
  existingOverviewContext?: string | null;
  agentTasksDocumentsContext?: string | null;
  otherTeammatesContext?: string | null;
  generatedAt?: Date;
  conversationIntro?: string;
  emptyConversationMessage?: string;
  overviewIntro?: string;
  agentMemoryIntro?: string;
};

export function appendAgentTaskSupplementalContextSections(
  sections: string[],
  {
    agentNotesContext,
    agentMemoryContext,
    existingOverviewContext,
    agentTasksDocumentsContext,
    otherTeammatesContext,
    overviewIntro = "What you already know about your shared work with this user, from your profile Overview (most recently and stable context) — stay consistent with this, do not contradict or repeat it:",
    agentMemoryIntro = "Your compact first-person Memory from your profile — decisions, preferences, and open loops you've retained from past conversations with this user. Stay consistent with this; do not suggest tasks that contradict it:",
  }: Pick<
    AgentTaskSharedContextInput,
    | "agentNotesContext"
    | "agentMemoryContext"
    | "existingOverviewContext"
    | "agentTasksDocumentsContext"
    | "otherTeammatesContext"
    | "overviewIntro"
    | "agentMemoryIntro"
  >,
): void {
  if (agentNotesContext?.trim()) {
    sections.push("", agentNotesContext.trim());
  }

  if (agentMemoryContext?.trim()) {
    sections.push("", agentMemoryIntro, agentMemoryContext.trim());
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

  appendAgentTaskOtherTeammatesContextSection(sections, otherTeammatesContext);
}

export function appendAgentTaskOtherTeammatesContextSection(
  sections: string[],
  otherTeammatesContext?: string | null,
): void {
  if (!otherTeammatesContext?.trim()) {
    return;
  }

  sections.push(
    "",
    "You are also kept aware of what your other AI teammates have recently discussed with the user — treat it the way a colleague on the same team would naturally know what others have been working on.",
    "Below are the most recently updated conversation summaries from their active chats — not full transcripts, but fresher than a compact profile memory would be. They are sorted by last activity across all teammates.",
    "Use this to avoid suggesting tasks that duplicate work already happening elsewhere, and to build on relevant work with another teammate when it's genuinely relevant — but only when a task still clearly falls within your own role.",
    "CRITICAL — attribution: this information belongs to another teammate's conversations, not yours. If you reference it in a task rationale, phrase it the way a colleague naturally would — e.g. \"I know you and Nova have been working on positioning\" — explicitly naming them. Never phrase it as something you personally discussed or decided.",
    "Don't invent details beyond what's summarized below, and if it's not relevant to a task you're suggesting, don't bring it up at all.",
    otherTeammatesContext.trim(),
  );
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
