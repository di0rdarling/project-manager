import type { Db, ObjectId } from "mongodb";
import {
  buildChatContextUsage,
  CHAT_CONTEXT_TOKEN_LIMIT,
} from "@/lib/chats/chat-context/chat-context-usage";
import { loadChatGenerationContext } from "@/lib/chats/chat-context/chat-generation-context";
import { countChatContextTokens, countTextTokens } from "@/lib/gemini";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";
import type { StoredChat, StoredChatMessage } from "@/lib/serialize/serialize-chat";
import type { ChatContextUsage, ChatContextUsageCategory } from "@/lib/types";

const BREAKDOWN_CATEGORY_LABELS: Record<
  ChatContextUsageCategory["key"],
  string
> = {
  systemPrompt: "System prompt",
  agentMemory: "Agent's memory",
  sharedMemory: "Shared memory",
  projectContext: "Project context",
  conversation: "Conversation",
};

/**
 * Distributes raw per-category token counts so they sum exactly to
 * `total` (the authoritative count from the single combined countTokens
 * call that also gates sending). Raw per-category counts are gathered via
 * separate countTokens calls and won't add up perfectly on their own
 * because of per-request formatting overhead, so we scale them
 * proportionally and settle any rounding remainder on the largest
 * category.
 */
function scaleBreakdownToTotal(
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
    label: BREAKDOWN_CATEGORY_LABELS[key],
    tokens: Math.max(0, scaled[key]),
  }));
}

export async function getChatContextUsage(
  db: Db,
  userId: ObjectId,
  chat: StoredChat,
  messages: StoredChatMessage[],
  userName: string | null,
  pendingMessage?: string,
): Promise<ChatContextUsage> {
  const generationContext = await loadChatGenerationContext(
    db,
    userId,
    chat,
    messages,
    userName,
  );

  const usedTokens = await countChatContextTokens({
    ...generationContext,
    pendingMessage,
  });

  const baseSystemPrompt = buildChatSystemPrompt(
    generationContext.teammateId,
    undefined,
    undefined,
    undefined,
    undefined,
    generationContext.userName,
  );

  const agentMemoryText = [
    generationContext.agentNotesContext,
    generationContext.otherConversationsContext,
  ]
    .filter(Boolean)
    .join("\n\n");

  const conversationText = [
    ...generationContext.history.map((entry) => entry.content),
    pendingMessage?.trim() ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const [
    systemPromptTokens,
    agentMemoryTokens,
    sharedMemoryTokens,
    projectContextTokens,
    conversationTokens,
  ] = await Promise.all([
    countTextTokens(baseSystemPrompt),
    countTextTokens(agentMemoryText),
    countTextTokens(generationContext.otherTeammatesContext ?? ""),
    countTextTokens(generationContext.projectContext ?? ""),
    countTextTokens(conversationText),
  ]);

  const breakdown = scaleBreakdownToTotal(
    {
      systemPrompt: systemPromptTokens,
      agentMemory: agentMemoryTokens,
      sharedMemory: sharedMemoryTokens,
      projectContext: projectContextTokens,
      conversation: conversationTokens,
    },
    usedTokens,
  );

  return {
    ...buildChatContextUsage(usedTokens),
    breakdown,
  };
}

export { CHAT_CONTEXT_TOKEN_LIMIT };
