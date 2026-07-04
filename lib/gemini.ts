import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenerativeAI(apiKey);
}

export async function generateText(prompt: string): Promise<string> {
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = getGeminiClient().getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

export async function generateProjectSummary(prompt: string): Promise<string> {
  return generateText(prompt);
}
