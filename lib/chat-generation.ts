import {
  getChatModelProvider,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  countChatContextTokens as countGeminiChatContextTokens,
  countTextTokens as countGeminiTextTokens,
  streamGeminiChatReply,
  type CountChatContextTokensInput,
  type GeminiChatMessage,
  type GeminiChatReplyStreamYield,
  type GenerateChatReplyResult,
} from "@/lib/gemini";
import {
  countKimiChatContextTokens,
  countKimiTextTokens,
  streamKimiChatReply,
  type KimiChatReplyStreamYield,
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

export type ChatReplyStreamYield =
  | { type: "token"; delta: string }
  | { type: "complete"; result: GenerateChatReplyResult };

export async function* streamChatReply(
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
  documentReviewContext?: string,
  agentTasksDocumentsContext?: string,
): AsyncGenerator<ChatReplyStreamYield> {
  const modelId = resolveModelId(modelName);
  const sharedInput = {
    history,
    message,
    teammateId,
    projectContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    modelName: modelId,
    generatedAt,
    documentReviewContext,
    agentTasksDocumentsContext,
  };

  const providerStream: AsyncGenerator<
    GeminiChatReplyStreamYield | KimiChatReplyStreamYield
  > =
    getChatModelProvider(modelId) === "kimi"
      ? streamKimiChatReply({
          ...sharedInput,
          modelId,
          reasoningEffort,
        })
      : streamGeminiChatReply(sharedInput);

  for await (const event of providerStream) {
    yield event;
  }
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
  documentReviewContext?: string,
  agentTasksDocumentsContext?: string,
): Promise<GenerateChatReplyResult> {
  const modelId = resolveModelId(modelName);

  let result: GenerateChatReplyResult | undefined;

  for await (const event of streamChatReply(
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
    documentReviewContext,
    agentTasksDocumentsContext,
  )) {
    if (event.type === "complete") {
      result = event.result;
    }
  }

  if (!result) {
    throw new Error("Chat returned an empty response");
  }

  return result;
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
