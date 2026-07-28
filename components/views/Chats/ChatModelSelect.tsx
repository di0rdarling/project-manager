"use client";

import { Select } from "@/components/ui/inputs/Select";
import {
  CHAT_MODEL_OPTIONS,
  type ChatModelId,
  type ChatModelProvider,
} from "@/lib/chats/chat-models";

const CHAT_MODEL_PROVIDER_LABELS: Record<ChatModelProvider, string> = {
  gemini: "Google Gemini",
  kimi: "Kimi (Moonshot AI)",
};

function buildChatModelGroups() {
  const providers = Array.from(
    new Set(CHAT_MODEL_OPTIONS.map((option) => option.provider)),
  );

  return providers.map((provider) => ({
    label: CHAT_MODEL_PROVIDER_LABELS[provider],
    options: CHAT_MODEL_OPTIONS.filter((option) => option.provider === provider).map(
      (option) => ({
        value: option.id,
        label: option.label,
      }),
    ),
  }));
}

const compactSelectClassName =
  "!px-2 !py-1 !text-xs sm:!px-2.5 sm:!py-1.5";

type ChatModelSelectProps = {
  id: string;
  value: ChatModelId;
  onChange: (modelId: ChatModelId) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
};

export function ChatModelSelect({
  id,
  value,
  onChange,
  disabled = false,
  className,
  showLabel = false,
  compact = !showLabel,
}: Readonly<ChatModelSelectProps>) {
  const mergedClassName = [compact ? compactSelectClassName : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Select
      id={id}
      label={showLabel ? "AI model" : undefined}
      aria-label={showLabel ? undefined : "AI model"}
      value={value}
      disabled={disabled}
      className={mergedClassName || undefined}
      onChange={(event) => onChange(event.target.value as ChatModelId)}
      groups={buildChatModelGroups()}
    />
  );
}
