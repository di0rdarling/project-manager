import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";
import type { ChatGroundingSource } from "@/lib/types";

export type GeminiChatMessage = {
  role: "user" | "model";
  content: string;
};

export type GenerateChatReplyResult = {
  content: string;
  sources?: ChatGroundingSource[];
  webSearchQueries?: string[];
  searchSuggestionsHtml?: string;
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return apiKey;
}

function getGeminiClient() {
  return new GoogleGenerativeAI(getGeminiApiKey());
}

function getGenAIClient() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
}

export function getChatModelName(): string {
  return (
    process.env.GEMINI_CHAT_MODEL ??
    process.env.GEMINI_MODEL ??
    "gemini-2.5-flash"
  );
}

function getDefaultModelName(): string {
  return process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
}

export function getMemoryModelName(): string {
  return (
    process.env.GEMINI_MEMORY_MODEL ??
    process.env.GEMINI_MODEL ??
    "gemini-2.5-flash"
  );
}

const DEFAULT_GEMINI_THINKING_BUDGET = 8192;

function parseThinkingBudget(value: string | undefined): number {
  if (!value?.trim()) {
    return DEFAULT_GEMINI_THINKING_BUDGET;
  }

  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < -1) {
    return DEFAULT_GEMINI_THINKING_BUDGET;
  }

  return parsed;
}

export function getThinkingBudget(): number {
  return parseThinkingBudget(process.env.GEMINI_THINKING_BUDGET);
}

function isInternalModelArtifactText(text: string): boolean {
  const trimmed = text.trim();

  return (
    /^tool_code\b/i.test(trimmed) ||
    /^thought\b/i.test(trimmed)
  );
}

function stripInternalModelArtifacts(text: string): string {
  const trimmed = text.trim();

  if (!trimmed || !isInternalModelArtifactText(trimmed)) {
    return trimmed;
  }

  const userFacingSegments = trimmed
    .split(/\n\n+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !isInternalModelArtifactText(segment));

  if (userFacingSegments.length > 0) {
    return userFacingSegments.join("\n\n").trim();
  }

  return trimmed
    .replace(/^tool_code[\s\S]*?\)\s*/i, "")
    .replace(/^thought\s+[\s\S]*?(?=\n\n|$)/i, "")
    .trim();
}

function extractUserFacingText(
  response: GenerateContentResponse,
): string | undefined {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let text = "";

  for (const part of parts) {
    if (part.thought) {
      continue;
    }

    if (
      part.executableCode ||
      part.functionCall ||
      part.codeExecutionResult ||
      part.functionResponse ||
      part.toolCall
    ) {
      continue;
    }

    if (typeof part.text === "string") {
      text += part.text;
    }
  }

  const sanitized = stripInternalModelArtifacts(text.trim());
  return sanitized || undefined;
}

function extractGroundingFromResponse(
  response: GenerateContentResponse,
): Pick<
  GenerateChatReplyResult,
  "sources" | "webSearchQueries" | "searchSuggestionsHtml"
> {
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

  if (!groundingMetadata) {
    return {};
  }

  const sources = groundingMetadata.groundingChunks
    ?.map((chunk) => chunk.web)
    .filter((web): web is NonNullable<typeof web> => Boolean(web?.uri))
    .reduce<ChatGroundingSource[]>((uniqueSources, web) => {
      if (uniqueSources.some((source) => source.uri === web.uri)) {
        return uniqueSources;
      }

      uniqueSources.push({
        title: web.title,
        uri: web.uri,
      });
      return uniqueSources;
    }, []);

  const webSearchQueries = groundingMetadata.webSearchQueries?.filter(Boolean);
  const searchSuggestionsHtml =
    groundingMetadata.searchEntryPoint?.renderedContent?.trim() || undefined;

  return {
    ...(sources?.length ? { sources } : {}),
    ...(webSearchQueries?.length ? { webSearchQueries } : {}),
    ...(searchSuggestionsHtml ? { searchSuggestionsHtml } : {}),
  };
}

export async function generateText(
  prompt: string,
  modelName?: string,
): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: modelName ?? getDefaultModelName(),
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

export async function generateChatReply(
  history: GeminiChatMessage[],
  message: string,
  teammateId?: ChatTeammateId,
  projectContext?: string,
  otherConversationsContext?: string,
  otherTeammatesContext?: string,
): Promise<GenerateChatReplyResult> {
  const chat = getGenAIClient().chats.create({
    model: getChatModelName(),
    config: {
      systemInstruction: buildChatSystemPrompt(
        teammateId,
        projectContext,
        otherConversationsContext,
        otherTeammatesContext,
      ),
      tools: [{ googleSearch: {} }],
      thinkingConfig: {
        includeThoughts: false,
        thinkingBudget: getThinkingBudget(),
      },
    },
    history: history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    })),
  });

  const response = await chat.sendMessage({ message });
  const text = extractUserFacingText(response);

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    content: text,
    ...extractGroundingFromResponse(response),
  };
}

export async function generateProjectSummary(prompt: string): Promise<string> {
  return generateText(prompt);
}

export async function generateConversationSummary(
  prompt: string,
): Promise<string> {
  return generateText(prompt);
}

export async function generateChatTitle(prompt: string): Promise<string> {
  const rawTitle = await generateText(prompt);
  const cleaned = rawTitle
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\.+$/, "")
    .trim();

  if (!cleaned) {
    throw new Error("Gemini returned an empty title");
  }

  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

export async function generateAgentMemory(prompt: string): Promise<string> {
  return generateText(prompt, getMemoryModelName());
}
