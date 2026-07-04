import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildChatSystemPrompt } from "@/lib/prompts/chat-prompt";

export type GeminiChatMessage = {
  role: "user" | "model";
  content: string;
};

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
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

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: getDefaultModelName(),
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
  projectContext?: string,
): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: getChatModelName(),
    systemInstruction: buildChatSystemPrompt(projectContext),
  });
  const chat = model.startChat({
    history: history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    })),
  });
  const result = await chat.sendMessage(message);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

export async function generateProjectSummary(prompt: string): Promise<string> {
  return generateText(prompt);
}
