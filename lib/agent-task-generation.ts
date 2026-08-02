import {
  getChatModelApiName,
  getChatModelProvider,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import { generateAgentTasks as generateGeminiAgentTasks } from "@/lib/gemini";
import { generateKimiJsonText } from "@/lib/kimi";

export async function generateAgentTasks(
  prompt: string,
  modelId?: ChatModelId,
): Promise<string> {
  const resolvedModelId = normalizeChatModelId(modelId);

  if (getChatModelProvider(resolvedModelId) === "kimi") {
    return generateKimiJsonText(prompt, resolvedModelId);
  }

  return generateGeminiAgentTasks(
    prompt,
    getChatModelApiName(resolvedModelId),
  );
}
