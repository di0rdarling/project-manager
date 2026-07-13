import type { ChatContextUsage } from "@/lib/types";

export const CHAT_CONTEXT_TOKEN_LIMIT = 1_000_000;

export function buildChatContextUsage(
  usedTokens: number,
): Omit<ChatContextUsage, "breakdown"> {
  return {
    usedTokens,
    limitTokens: CHAT_CONTEXT_TOKEN_LIMIT,
    isAtLimit: usedTokens >= CHAT_CONTEXT_TOKEN_LIMIT,
  };
}

export function getChatContextUsagePercent(usage: ChatContextUsage): number {
  if (usage.limitTokens <= 0) {
    return 0;
  }

  return Math.min(100, (usage.usedTokens / usage.limitTokens) * 100);
}

export function formatTokenCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString();
}

const compactTokenFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactTokenCount(value: number): string {
  return compactTokenFormatter.format(Math.max(0, Math.round(value)));
}

/**
 * Same as `formatCompactTokenCount`, but with a space before the unit
 * suffix, e.g. "161.7 K" or "1 M" instead of "161.7K" / "1M".
 */
export function formatSpacedCompactTokenCount(value: number): string {
  return formatCompactTokenCount(value).replace(/([\d.]+)([A-Za-z]+)$/, "$1 $2");
}
