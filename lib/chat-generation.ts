import {
  getChatModelProvider,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  countChatContextTokens as countGeminiChatContextTokens,
  countTextTokens as countGeminiTextTokens,
  generateChatReply as generateGeminiChatReply,
  type CountChatContextTokensInput,
  type GeminiChatMessage,
  type GenerateChatReplyResult,
} from "@/lib/gemini";
import {
  countKimiChatContextTokens,
  countKimiTextTokens,
  generateKimiChatReply,
} from "@/lib/kimi";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";

export type {
  CountChatContextTokensInput,
  GeminiChatMessage,
  GenerateChatReplyResult,
};

function resolveModelId(modelName?: string): ChatModelId {
  return normalizeChatModelId(modelName);
}

export async function generateChatReply(
  history: GeminiChatMessage[],
  message: string,
  teammateId?: ChatTeammateId,
  projectContext?: string,
  otherConversationsContext?: string,
  otherTeammatesContext?: string,
  agentNotesContext?: string,
  userName?: string | null,
  modelName?: string,
  reasoningEffort?: KimiReasoningEffort,
  generatedAt?: Date,
): Promise<GenerateChatReplyResult> {
  const modelId = resolveModelId(modelName);

  if (getChatModelProvider(modelId) === "kimi") {
    return generateKimiChatReply(
      history,
      message,
      teammateId,
      projectContext,
      otherConversationsContext,
      otherTeammatesContext,
      agentNotesContext,
      userName,
      modelId,
      reasoningEffort,
      generatedAt,
    );
  }

  return generateGeminiChatReply(
    history,
    message,
    teammateId,
    projectContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    modelId,
    generatedAt,
  );
}

export async function countChatContextTokens(
  input: CountChatContextTokensInput,
): Promise<number> {
  const modelId = resolveModelId(input.modelName);

  if (getChatModelProvider(modelId) === "kimi") {
    return countKimiChatContextTokens(input);
  }

  return countGeminiChatContextTokens({
    ...input,
    modelName: modelId,
  });
}

export async function countTextTokens(
  text: string,
  modelName?: string,
): Promise<number> {
  const modelId = resolveModelId(modelName);

  if (getChatModelProvider(modelId) === "kimi") {
    return countKimiTextTokens(text);
  }

  return countGeminiTextTokens(text, modelId);
}

export function getChatProviderConfigError(modelName?: string): string | null {
  const modelId = resolveModelId(modelName);
  const provider = getChatModelProvider(modelId);

  if (provider === "kimi") {
    const hasKey =
      Boolean(process.env.KIMI_API_KEY?.trim()) ||
      Boolean(process.env.MOONSHOT_API_KEY?.trim());

    return hasKey ? null : "KIMI_API_KEY is not configured";
  }

  return process.env.GEMINI_API_KEY?.trim()
    ? null
    : "GEMINI_API_KEY is not configured";
}
