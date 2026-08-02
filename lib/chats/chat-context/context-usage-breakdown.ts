import {
  isCrossProjectTeammate,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { ChatContextUsageCategory } from "@/lib/types";

export const CONTEXT_USAGE_CATEGORY_LABELS: Record<
  ChatContextUsageCategory["key"],
  string
> = {
  systemPrompt: "System prompt",
  agentMemory: "Agent's memory",
  sharedMemory: "Other teammates",
  projectContext: "Project context",
  conversation: "Conversation",
};

/**
 * Text that lands in the system prompt under the project-context and
 * document-review sections, for token breakdown under "Project context".
 */
export function buildProjectContextBucketText(
  teammateId: ChatTeammateId,
  projectContext?: string,
  agentTasksDocumentsContext?: string,
  documentReviewContext?: string,
): string {
  const sections: string[] = [];

  if (projectContext?.trim()) {
    if (isCrossProjectTeammate(teammateId)) {
      sections.push(
        "You have visibility across all of the user's projects. Use this cross-project context — notes, requirements, domain knowledge, and project details — to inform your replies:",
        projectContext.trim(),
      );
    } else {
      sections.push(
        "The user started this chat to discuss the following project. Use this context to inform your replies:",
        projectContext.trim(),
      );
    }
  }

  if (agentTasksDocumentsContext?.trim()) {
    sections.push(
      "### Your autonomous tasks and deliverables",
      agentTasksDocumentsContext.trim(),
    );
  }

  if (documentReviewContext?.trim()) {
    sections.push(documentReviewContext.trim());
  }

  return sections.join("\n\n");
}

export function scaleContextUsageBreakdownToTotal(
  rawCounts: Record<ChatContextUsageCategory["key"], number>,
  total: number,
): ChatContextUsageCategory[] {
  const keys = Object.keys(rawCounts) as ChatContextUsageCategory["key"][];
  const rawTotal = keys.reduce((sum, key) => sum + rawCounts[key], 0);

  const scaled: Record<ChatContextUsageCategory["key"], number> =
    rawTotal > 0
      ? keys.reduce(
          (acc, key) => {
            acc[key] = Math.round((rawCounts[key] / rawTotal) * total);
            return acc;
          },
          {} as Record<ChatContextUsageCategory["key"], number>,
        )
      : keys.reduce(
          (acc, key) => {
            acc[key] = 0;
            return acc;
          },
          {} as Record<ChatContextUsageCategory["key"], number>,
        );

  const scaledTotal = keys.reduce((sum, key) => sum + scaled[key], 0);
  const remainder = total - scaledTotal;

  if (remainder !== 0) {
    const largestKey = keys.reduce((largest, key) =>
      rawCounts[key] > rawCounts[largest] ? key : largest,
    );
    scaled[largestKey] += remainder;
  }

  return keys.map((key) => ({
    key,
    label: CONTEXT_USAGE_CATEGORY_LABELS[key],
    tokens: Math.max(0, scaled[key]),
  }));
}
