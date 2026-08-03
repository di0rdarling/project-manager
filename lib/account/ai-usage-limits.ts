import type { UserSubscription } from "@/lib/types";

export type AiUsageCategoryKey =
  | "activeProjects"
  | "aiChats"
  | "aiTextEnhancements"
  | "aiSummaries"
  | "aiTeammates";

export type AiUsageLimitCategory = {
  key: AiUsageCategoryKey;
  label: string;
  used: number;
  max: number;
};

const CATEGORY_LABELS: Record<AiUsageCategoryKey, string> = {
  activeProjects: "Active projects",
  aiChats: "AI chats",
  aiTextEnhancements: "AI text enhancements",
  aiSummaries: "AI summaries",
  aiTeammates: "AI teammates",
};

const PLACEHOLDER_USAGE: Record<
  UserSubscription,
  Record<AiUsageCategoryKey, { used: number; max: number }>
> = {
  free: {
    activeProjects: { used: 2, max: 3 },
    aiChats: { used: 18, max: 25 },
    aiTextEnhancements: { used: 11, max: 15 },
    aiSummaries: { used: 7, max: 10 },
    aiTeammates: { used: 2, max: 2 },
  },
  premium: {
    activeProjects: { used: 8, max: 20 },
    aiChats: { used: 64, max: 200 },
    aiTextEnhancements: { used: 42, max: 100 },
    aiSummaries: { used: 28, max: 75 },
    aiTeammates: { used: 4, max: 10 },
  },
};

const CATEGORY_ORDER: AiUsageCategoryKey[] = [
  "activeProjects",
  "aiChats",
  "aiTextEnhancements",
  "aiSummaries",
  "aiTeammates",
];

export function getPlaceholderAiUsageLimits(
  subscription: UserSubscription,
): AiUsageLimitCategory[] {
  const usage = PLACEHOLDER_USAGE[subscription];

  return CATEGORY_ORDER.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    used: usage[key].used,
    max: usage[key].max,
  }));
}

export function getAiUsagePercent(used: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((used / max) * 100));
}
