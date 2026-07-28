"use client";

import { Select } from "@/components/ui/inputs/Select";
import {
  KIMI_REASONING_EFFORT_OPTIONS,
  type KimiReasoningEffort,
} from "@/lib/chats/kimi-reasoning-effort";

const compactSelectClassName =
  "!px-2 !py-1 !text-xs sm:!px-2.5 sm:!py-1.5";

type ChatReasoningEffortSelectProps = {
  id: string;
  value: KimiReasoningEffort;
  onChange: (reasoningEffort: KimiReasoningEffort) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
};

export function ChatReasoningEffortSelect({
  id,
  value,
  onChange,
  disabled = false,
  className,
  showLabel = false,
  compact = !showLabel,
}: Readonly<ChatReasoningEffortSelectProps>) {
  const mergedClassName = [compact ? compactSelectClassName : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Select
      id={id}
      label={showLabel ? "Reasoning effort" : undefined}
      aria-label={showLabel ? undefined : "Reasoning effort"}
      value={value}
      disabled={disabled}
      className={mergedClassName || undefined}
      onChange={(event) =>
        onChange(event.target.value as KimiReasoningEffort)
      }
      options={KIMI_REASONING_EFFORT_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
    />
  );
}
