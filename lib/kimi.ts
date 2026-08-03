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

export function getKimiClient() {
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

type KimiChatGenerationOptions = {
  history: GeminiChatMessage[];
  message: string;
  teammateId?: ChatTeammateId;
  projectContext?: string;
  otherConversationsContext?: string;
  otherTeammatesContext?: string;
  agentNotesContext?: string;
  userName?: string | null;
  modelId?: string;
  reasoningEffort?: KimiReasoningEffort;
  generatedAt?: Date;
  documentReviewContext?: string;
  agentTasksDocumentsContext?: string;
};

function buildKimiChatMessages(
  options: KimiChatGenerationOptions,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemPrompt = buildChatSystemPrompt(
    options.teammateId,
    options.projectContext,
    options.otherConversationsContext,
    options.otherTeammatesContext,
    options.agentNotesContext,
    options.userName,
    options.generatedAt,
    options.documentReviewContext,
    options.agentTasksDocumentsContext,
  );

  return [
    { role: "system", content: systemPrompt },
    ...options.history.map((entry) => ({
      role: toKimiRole(entry.role),
      content: entry.content,
    })),
    { role: "user", content: options.message },
  ];
}

export type KimiChatReplyStreamYield =
  | { type: "token"; delta: string }
  | { type: "complete"; result: GenerateChatReplyResult };

export async function* streamKimiChatReply(
  options: KimiChatGenerationOptions,
): AsyncGenerator<KimiChatReplyStreamYield> {
  try {
    const client = getKimiClient();
    const stream = await client.chat.completions.create({
      model: resolveKimiModelName(options.modelId),
      ...(options.reasoningEffort
        ? { reasoning_effort: options.reasoningEffort }
        : {}),
      messages: buildKimiChatMessages(options),
      stream: true,
    });

    let content = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;

      if (delta) {
        content += delta;
        yield { type: "token", delta };
      }
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new KimiApiError("Kimi returned an empty response.", 502);
    }

    yield {
      type: "complete",
      result: { content: trimmedContent },
    };
  } catch (error) {
    throw toKimiApiError(error);
  }
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
  documentReviewContext?: string,
  agentTasksDocumentsContext?: string,
): Promise<GenerateChatReplyResult> {
  let result: GenerateChatReplyResult | undefined;

  for await (const event of streamKimiChatReply({
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
  })) {
    if (event.type === "complete") {
      result = event.result;
    }
  }

  if (!result) {
    throw new KimiApiError("Kimi returned an empty response.", 502);
  }

  return result;
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
  documentReviewContext?: string;
  agentTasksDocumentsContext?: string;
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
    documentReviewContext,
    agentTasksDocumentsContext,
  } = input;

  const systemPrompt = buildChatSystemPrompt(
    teammateId,
    projectContext,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    undefined,
    documentReviewContext,
    agentTasksDocumentsContext,
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

export async function generateKimiJsonText(
  prompt: string,
  modelId?: ChatModelId,
): Promise<string> {
  try {
    const client = getKimiClient();
    const completion = await client.chat.completions.create({
      model: resolveKimiModelName(modelId),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const assistantMessage = completion.choices[0]?.message;
    const content = assistantMessage
      ? extractKimiMessageContent(assistantMessage)
      : "";

    if (!content) {
      throw new KimiApiError("Kimi returned an empty response.", 502);
    }

    return content;
  } catch (error) {
    throw toKimiApiError(error);
  }
}
