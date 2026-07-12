export const CHAT_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export type ChatModelId = (typeof CHAT_MODEL_IDS)[number];

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "gemini-2.5-flash";

export const CHAT_MODEL_OPTIONS: ReadonlyArray<{
  id: ChatModelId;
  label: string;
}> = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
];

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
  return (
    CHAT_MODEL_OPTIONS.find((option) => option.id === modelId)?.label ?? modelId
  );
}
