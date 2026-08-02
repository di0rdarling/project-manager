import type { Db, ObjectId } from "mongodb";
import {
  buildChatContextUsage,
  CHAT_CONTEXT_TOKEN_LIMIT,
} from "@/lib/chats/chat-context/chat-context-usage";
import { loadDocumentReviewGenerationContext } from "@/lib/chats/chat-context/document-review-generation-context";
import {
  countChatContextTokens,
  countTextTokens,
} from "@/lib/chat-generation";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import type {
  AgentDocumentReviewMessageResponse,
  ChatContextUsage,
  ChatContextUsageCategory,
} from "@/lib/types";

const BREAKDOWN_CATEGORY_LABELS: Record<
  ChatContextUsageCategory["key"],
  string
> = {
  systemPrompt: "System prompt",
  agentMemory: "Agent's memory",
  sharedMemory: "Other teammates",
  projectContext: "Project context",
  conversation: "Conversation",
};

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

type GetDocumentReviewContextUsageInput = {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  document: AgentDocumentResponse;
  task: AgentTask | null;
  messages: AgentDocumentReviewMessageResponse[];
  userName: string | null;
  modelId: ChatModelId;
  reasoningEffort: KimiReasoningEffort | null;
  conversationSummary: string | null;
  pendingMessage?: string;
};

export async function getDocumentReviewContextUsage(
  input: GetDocumentReviewContextUsageInput,
): Promise<ChatContextUsage> {
  const generationContext = await loadDocumentReviewGenerationContext(
    input.db,
    input.userId,
    input.teammateId,
    input.document,
    input.task,
    input.messages,
    input.userName,
    input.modelId,
    input.reasoningEffort,
    input.conversationSummary,
  );

  const usedTokens = await countChatContextTokens({
    history: generationContext.history,
    teammateId: generationContext.teammateId,
    projectContext: generationContext.projectContext,
    otherConversationsContext: generationContext.otherConversationsContext,
    otherTeammatesContext: generationContext.otherTeammatesContext,
    agentNotesContext: generationContext.agentNotesContext,
    userName: generationContext.userName,
    modelName: generationContext.modelId,
    pendingMessage: input.pendingMessage,
    documentReviewContext: generationContext.documentReviewContext,
  });

  const modelId = generationContext.modelId;
  const combinedProjectContext = [
    generationContext.projectContext,
    generationContext.documentReviewContext,
  ]
    .filter(Boolean)
    .join("\n\n");

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
    input.pendingMessage?.trim() ?? "",
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
    countTextTokens(baseSystemPrompt, modelId),
    countTextTokens(agentMemoryText, modelId),
    countTextTokens(generationContext.otherTeammatesContext ?? "", modelId),
    countTextTokens(combinedProjectContext, modelId),
    countTextTokens(conversationText, modelId),
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
