import {
  formatAiTeammateLimitNames,
  FREE_TIER_AI_TEAMMATE_IDS,
  getSubscriptionLimits,
  PREMIUM_TIER_AI_TEAMMATE_IDS,
} from "@/lib/account/subscription-limits";
import type { UserSubscription } from "@/lib/types";

export type AiUsageCategoryKey =
  | "activeProjects"
  | "aiChats"
  | "aiTextEnhancements"
  | "aiSummaries"
  | "aiTeammates";

type AiUsageLimitBase = {
  key: AiUsageCategoryKey;
  label: string;
  used: number;
  isLiveData: boolean;
  showPlaceholderChip: boolean;
};

export type NumericAiUsageLimit = AiUsageLimitBase & {
  kind: "numeric";
  max: number;
  unitLabel: string;
};

export type UnlimitedAiUsageLimit = AiUsageLimitBase & {
  kind: "unlimited";
};

export type TeammateAiUsageLimit = AiUsageLimitBase & {
  kind: "teammates";
  max: number;
  includedLabel: string;
  summaryLabel: string;
};

export type AiUsageLimitCategory =
  | NumericAiUsageLimit
  | UnlimitedAiUsageLimit
  | TeammateAiUsageLimit;

const CATEGORY_LABELS: Record<AiUsageCategoryKey, string> = {
  activeProjects: "Active projects",
  aiChats: "AI chats",
  aiTextEnhancements: "AI text enhancements",
  aiSummaries: "AI summaries",
  aiTeammates: "AI teammates",
};

/** Illustrative usage until real tracking is wired up. */
const PLACEHOLDER_USED: Record<
  UserSubscription,
  Record<AiUsageCategoryKey, number>
> = {
  free: {
    activeProjects: 1,
    aiChats: 142,
    aiTextEnhancements: 38,
    aiSummaries: 12,
    aiTeammates: FREE_TIER_AI_TEAMMATE_IDS.length,
  },
  premium: {
    activeProjects: 5,
    aiChats: 890,
    aiTextEnhancements: 210,
    aiSummaries: 34,
    aiTeammates: PREMIUM_TIER_AI_TEAMMATE_IDS.length,
  },
};

const CATEGORY_ORDER: AiUsageCategoryKey[] = [
  "activeProjects",
  "aiChats",
  "aiTextEnhancements",
  "aiSummaries",
  "aiTeammates",
];

/** Categories with live usage tracking wired up — add keys here as tracking ships. */
export const AI_USAGE_LIVE_DATA_CATEGORIES: ReadonlySet<AiUsageCategoryKey> =
  new Set(["activeProjects", "aiChats"]);

export function isAiUsageCategoryLive(key: AiUsageCategoryKey): boolean {
  return AI_USAGE_LIVE_DATA_CATEGORIES.has(key);
}

/** Rows that should show the "Placeholder" chip on the account page. */
export const AI_USAGE_PLACEHOLDER_CHIP_CATEGORIES: ReadonlySet<AiUsageCategoryKey> =
  new Set(["aiTextEnhancements", "aiSummaries"]);

export type AiUsageCounts = Partial<Record<AiUsageCategoryKey, number>>;

function getCategoryUsedCount(
  subscription: UserSubscription,
  key: AiUsageCategoryKey,
  usageCounts?: AiUsageCounts,
): number {
  const liveCount = usageCounts?.[key];
  if (liveCount !== undefined) {
    return liveCount;
  }

  return PLACEHOLDER_USED[subscription][key];
}

function buildUsageLimitCategory(
  subscription: UserSubscription,
  key: AiUsageCategoryKey,
  usageCounts?: AiUsageCounts,
): AiUsageLimitCategory {
  const limits = getSubscriptionLimits(subscription);
  const used = getCategoryUsedCount(subscription, key, usageCounts);
  const label = CATEGORY_LABELS[key];
  const isLiveData = isAiUsageCategoryLive(key);
  const showPlaceholderChip = AI_USAGE_PLACEHOLDER_CHIP_CATEGORIES.has(key);

  switch (key) {
    case "activeProjects":
      if (limits.activeProjects === null) {
        return {
          kind: "unlimited",
          key,
          label,
          used,
          isLiveData,
          showPlaceholderChip,
        };
      }

      return {
        kind: "numeric",
        key,
        label,
        used,
        isLiveData,
        showPlaceholderChip,
        max: limits.activeProjects,
        unitLabel: "projects",
      };

    case "aiChats":
      return {
        kind: "numeric",
        key,
        label,
        used,
        isLiveData,
        showPlaceholderChip,
        max: limits.aiChatMessagesPerMonth,
        unitLabel: "messages per month",
      };

    case "aiTextEnhancements":
      return {
        kind: "numeric",
        key,
        label,
        used,
        isLiveData,
        showPlaceholderChip,
        max: limits.aiTextEnhancementsPerMonth,
        unitLabel: "enhancements per month",
      };

    case "aiSummaries":
      return {
        kind: "numeric",
        key,
        label,
        used,
        isLiveData,
        showPlaceholderChip,
        max: limits.aiSummariesPerMonth,
        unitLabel: "summaries per month",
      };

    case "aiTeammates": {
      const teammateIds = limits.aiTeammateIds;

      return {
        kind: "teammates",
        key,
        label,
        used: teammateIds.length,
        isLiveData,
        showPlaceholderChip,
        max: teammateIds.length,
        includedLabel: formatAiTeammateLimitNames(teammateIds),
        summaryLabel:
          subscription === "premium"
            ? "Full suite"
            : `${teammateIds.length} included`,
      };
    }
  }
}

export function getAiUsageLimits(
  subscription: UserSubscription,
  usageCounts?: AiUsageCounts,
): AiUsageLimitCategory[] {
  return CATEGORY_ORDER.map((key) =>
    buildUsageLimitCategory(subscription, key, usageCounts),
  );
}

export function getAiUsagePercent(used: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((used / max) * 100));
}

export function formatAiUsageLimitValue(category: AiUsageLimitCategory): string {
  switch (category.kind) {
    case "unlimited":
      return `${category.used} / Unlimited`;

    case "teammates":
      return category.summaryLabel;

    case "numeric":
      return `${category.used} / ${category.max}`;
  }
}
