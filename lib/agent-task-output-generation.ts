import {
  parseCreateAgentDocumentToolArgs,
  type CreateAgentDocumentToolArgs,
} from "@/lib/agents/agent-document-tool";
import {
  getChatModelApiName,
  getChatModelProvider,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import { generateAgentTaskOutput as generateGeminiAgentTaskOutput } from "@/lib/gemini";
import { generateKimiJsonText } from "@/lib/kimi";

const KIMI_OUTPUT_JSON_SUFFIX = `

---

### Response format

Return a JSON object with exactly these fields. No preamble, no markdown fencing — just the JSON object:
{
  "title": string,
  "content": string,
  "approach": string,
  "completion_summary": string
}
`;

function stripJsonFencing(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseAgentTaskOutputJson(raw: string): CreateAgentDocumentToolArgs {
  const parsed = JSON.parse(stripJsonFencing(raw)) as unknown;
  return parseCreateAgentDocumentToolArgs(parsed);
}

export async function generateAgentTaskOutput(
  prompt: string,
  modelId?: ChatModelId,
): Promise<CreateAgentDocumentToolArgs> {
  const resolvedModelId = normalizeChatModelId(modelId);

  if (getChatModelProvider(resolvedModelId) === "kimi") {
    const json = await generateKimiJsonText(
      prompt + KIMI_OUTPUT_JSON_SUFFIX,
      resolvedModelId,
    );
    return parseAgentTaskOutputJson(json);
  }

  const call = await generateGeminiAgentTaskOutput(
    prompt,
    getChatModelApiName(resolvedModelId),
  );

  return parseCreateAgentDocumentToolArgs(call.args);
}
