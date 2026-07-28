import type { ChatModelId } from "@/lib/chats/chat-models";

export const KIMI_REASONING_EFFORTS = ["low", "high", "max"] as const;

export type KimiReasoningEffort = (typeof KIMI_REASONING_EFFORTS)[number];

export const DEFAULT_KIMI_REASONING_EFFORT: KimiReasoningEffort = "max";

const KIMI_REASONING_EFFORT_LABELS: Record<KimiReasoningEffort, string> = {
  low: "Low",
  high: "High",
  max: "Max",
};

export function isKimiReasoningEffort(value: unknown): value is KimiReasoningEffort {
  return (
    typeof value === "string" &&
    KIMI_REASONING_EFFORTS.includes(value as KimiReasoningEffort)
  );
}

export function normalizeKimiReasoningEffort(
  value: unknown,
): KimiReasoningEffort {
  return isKimiReasoningEffort(value)
    ? value
    : DEFAULT_KIMI_REASONING_EFFORT;
}

export function chatModelSupportsReasoningEffort(
  modelId: ChatModelId,
): boolean {
  return modelId === "kimi-k3";
}

export function getKimiReasoningEffortLabel(
  effort: KimiReasoningEffort,
): string {
  return KIMI_REASONING_EFFORT_LABELS[effort];
}

export function resolveChatReasoningEffort(
  modelId: ChatModelId,
  storedValue?: KimiReasoningEffort | null,
): KimiReasoningEffort | undefined {
  if (!chatModelSupportsReasoningEffort(modelId)) {
    return undefined;
  }

  return normalizeKimiReasoningEffort(storedValue);
}

export const KIMI_REASONING_EFFORT_OPTIONS: ReadonlyArray<{
  value: KimiReasoningEffort;
  label: string;
}> = KIMI_REASONING_EFFORTS.map((effort) => ({
  value: effort,
  label: KIMI_REASONING_EFFORT_LABELS[effort],
}));
