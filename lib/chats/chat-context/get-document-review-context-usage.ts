import type { Db, ObjectId } from "mongodb";
import {
  buildChatContextUsage,
  CHAT_CONTEXT_TOKEN_LIMIT,
} from "@/lib/chats/chat-context/chat-context-usage";
import {
  buildProjectContextBucketText,
  scaleContextUsageBreakdownToTotal,
} from "@/lib/chats/chat-context/context-usage-breakdown";
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
} from "@/lib/types";

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
    agentTasksDocumentsContext: generationContext.agentTasksDocumentsContext,
  });

  const modelId = generationContext.modelId;

  const projectContextBucketText = buildProjectContextBucketText(
    generationContext.teammateId,
    generationContext.projectContext,
    generationContext.agentTasksDocumentsContext,
    generationContext.documentReviewContext,
  );

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
    countTextTokens(projectContextBucketText, modelId),
    countTextTokens(conversationText, modelId),
  ]);

  const breakdown = scaleContextUsageBreakdownToTotal(
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
