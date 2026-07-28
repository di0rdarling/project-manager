export const CHAT_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "kimi-k3",
  "kimi-k2.6",
  "kimi-k2.7-code-highspeed",
] as const;

export type ChatModelId = (typeof CHAT_MODEL_IDS)[number];

export type ChatModelProvider = "gemini" | "kimi";

type ChatModelConfig = {
  provider: ChatModelProvider;
  label: string;
  apiModel: string;
};

const CHAT_MODEL_CONFIG: Record<ChatModelId, ChatModelConfig> = {
  "gemini-2.5-flash": {
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    apiModel: "gemini-2.5-flash",
  },
  "gemini-3.5-flash": {
    provider: "gemini",
    label: "Gemini 3.5 Flash",
    apiModel: "gemini-3.5-flash",
  },
  "gemini-3.1-flash-lite": {
    provider: "gemini",
    label: "Gemini 3.1 Flash Lite",
    apiModel: "gemini-3.1-flash-lite",
  },
  "kimi-k3": {
    provider: "kimi",
    label: "Kimi K3",
    apiModel: "kimi-k3",
  },
  "kimi-k2.6": {
    provider: "kimi",
    label: "Kimi K2.6",
    apiModel: "kimi-k2.6",
  },
  "kimi-k2.7-code-highspeed": {
    provider: "kimi",
    label: "Kimi K2.7 Code (High Speed)",
    apiModel: "kimi-k2.7-code-highspeed",
  },
};

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "gemini-2.5-flash";

export const CHAT_MODEL_OPTIONS: ReadonlyArray<{
  id: ChatModelId;
  label: string;
  provider: ChatModelProvider;
}> = CHAT_MODEL_IDS.map((id) => ({
  id,
  label: CHAT_MODEL_CONFIG[id].label,
  provider: CHAT_MODEL_CONFIG[id].provider,
}));

export function isChatModelId(value: unknown): value is ChatModelId {
  return (
    typeof value === "string" &&
    CHAT_MODEL_IDS.includes(value as ChatModelId)
  );
}

export function normalizeChatModelId(value: unknown): ChatModelId {
  return isChatModelId(value) ? value : DEFAULT_CHAT_MODEL_ID;
}

export function getChatModelLabel(modelId: ChatModelId): string {
  return CHAT_MODEL_CONFIG[modelId]?.label ?? modelId;
}

export function getChatModelProvider(modelId: ChatModelId): ChatModelProvider {
  return CHAT_MODEL_CONFIG[modelId]?.provider ?? "gemini";
}

export function getChatModelApiName(modelId: ChatModelId): string {
  return CHAT_MODEL_CONFIG[modelId]?.apiModel ?? modelId;
}

export function isKimiModelId(modelId: ChatModelId): boolean {
  return getChatModelProvider(modelId) === "kimi";
}
