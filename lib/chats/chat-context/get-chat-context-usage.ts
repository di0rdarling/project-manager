import type { Db, ObjectId } from "mongodb";
import {
  buildChatContextUsage,
  CHAT_CONTEXT_TOKEN_LIMIT,
} from "@/lib/chats/chat-context/chat-context-usage";
import {
  buildProjectContextBucketText,
  scaleContextUsageBreakdownToTotal,
} from "@/lib/chats/chat-context/context-usage-breakdown";
import { loadChatGenerationContext } from "@/lib/chats/chat-context/chat-generation-context";
import {
  countChatContextTokens,
  countTextTokens,
} from "@/lib/chat-generation";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";
import type { StoredChat, StoredChatMessage } from "@/lib/serialize/serialize-chat";
import type { ChatContextUsage } from "@/lib/types";

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
    history: generationContext.history,
    teammateId: generationContext.teammateId,
    projectContext: generationContext.projectContext,
    otherConversationsContext: generationContext.otherConversationsContext,
    otherTeammatesContext: generationContext.otherTeammatesContext,
    agentNotesContext: generationContext.agentNotesContext,
    userName: generationContext.userName,
    modelName: generationContext.modelId,
    pendingMessage,
    agentTasksDocumentsContext: generationContext.agentTasksDocumentsContext,
  });

  const modelId = generationContext.modelId;

  const projectContextBucketText = buildProjectContextBucketText(
    generationContext.teammateId,
    generationContext.projectContext,
    generationContext.agentTasksDocumentsContext,
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
