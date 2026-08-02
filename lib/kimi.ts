import OpenAI from "openai";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { getChatModelApiName } from "@/lib/chats/chat-models";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type {
  GeminiChatMessage,
  GenerateChatReplyResult,
} from "@/lib/gemini";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";

const KIMI_BASE_URL = "https://api.moonshot.ai/v1";

export class KimiApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "KimiApiError";
    this.status = status;
  }
}

function toKimiApiError(error: unknown): KimiApiError {
  if (error instanceof KimiApiError) {
    return error;
  }

  if (error instanceof OpenAI.APIError) {
    const apiMessage =
      typeof error.error === "object" &&
      error.error &&
      "message" in error.error &&
      typeof error.error.message === "string"
        ? error.error.message
        : error.message;

    if (
      error.status === 429 ||
      apiMessage.toLowerCase().includes("insufficient balance") ||
      apiMessage.toLowerCase().includes("exceeded")
    ) {
      return new KimiApiError(
        "Your Kimi account has insufficient balance. Add credits at platform.kimi.ai to continue using Kimi models.",
        402,
      );
    }

    if (error.status === 401) {
      return new KimiApiError(
        "Invalid Kimi API key. Check KIMI_API_KEY in your environment.",
        503,
      );
    }

    return new KimiApiError(apiMessage, error.status ?? 502);
  }

  if (error instanceof Error) {
    return new KimiApiError(error.message);
  }

  return new KimiApiError("Kimi request failed");
}

export function getKimiApiKey(): string {
  const apiKey = process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY;

  if (!apiKey) {
    throw new Error("KIMI_API_KEY is not configured");
  }

  return apiKey;
}

function getKimiClient() {
  return new OpenAI({
    apiKey: getKimiApiKey(),
    baseURL: KIMI_BASE_URL,
  });
}

function getDefaultKimiModelName(): string {
  return (
    process.env.KIMI_CHAT_MODEL ??
    process.env.KIMI_MODEL ??
    "kimi-k3"
  );
}

function resolveKimiModelName(modelId?: string): string {
  if (modelId && modelId.startsWith("kimi-")) {
    return getChatModelApiName(modelId as ChatModelId);
  }

  return modelId ?? getDefaultKimiModelName();
}

function toKimiRole(role: GeminiChatMessage["role"]): "user" | "assistant" {
  return role === "model" ? "assistant" : "user";
}

function estimateTextTokens(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return Math.ceil(text.length / 4);
}

function extractKimiMessageContent(message: OpenAI.Chat.Completions.ChatCompletionMessage): string {
  const content = message.content?.trim();
  if (content) {
    return content;
  }

  const reasoningContent = (
    message as OpenAI.Chat.Completions.ChatCompletionMessage & {
      reasoning_content?: string | null;
    }
  ).reasoning_content?.trim();

  return reasoningContent ?? "";
}

export async function generateKimiChatReply(
  history: GeminiChatMessage[],
  message: string,
  teammateId?: ChatTeammateId,
  projectContext?: string,
  otherConversationsContext?: string,
  otherTeammatesContext?: string,
  agentNotesContext?: string,
  userName?: string | null,
  modelId?: string,
  reasoningEffort?: KimiReasoningEffort,
  generatedAt?: Date,
): Promise<GenerateChatReplyResult> {
  try {
    const client = getKimiClient();
    const systemPrompt = buildChatSystemPrompt(
      teammateId,
      projectContext,
      otherConversationsContext,
      otherTeammatesContext,
      agentNotesContext,
      userName,
      generatedAt,
    );

    const completion = await client.chat.completions.create({
      model: resolveKimiModelName(modelId),
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((entry) => ({
          role: toKimiRole(entry.role),
          content: entry.content,
        })),
        { role: "user", content: message },
      ],
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const assistantMessage = completion.choices[0]?.message;
    const content = assistantMessage
      ? extractKimiMessageContent(assistantMessage)
      : "";

    if (!content) {
      throw new KimiApiError("Kimi returned an empty response.", 502);
    }

    return { content };
  } catch (error) {
    throw toKimiApiError(error);
  }
}

export type CountKimiChatContextTokensInput = {
  history: GeminiChatMessage[];
  teammateId?: ChatTeammateId;
  projectContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName?: string | null;
  pendingMessage?: string;
};

export async function countKimiChatContextTokens(
  input: CountKimiChatContextTokensInput,
): Promise<number> {
  const {
    history,
    teammateId,
    projectContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    pendingMessage,
  } = input;

  const systemPrompt = buildChatSystemPrompt(
    teammateId,
    projectContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
  );

  const conversationText = [
    ...history.map((entry) => entry.content),
    pendingMessage?.trim() ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    estimateTextTokens(systemPrompt) + estimateTextTokens(conversationText)
  );
}

export async function countKimiTextTokens(text: string): Promise<number> {
  return estimateTextTokens(text);
}
