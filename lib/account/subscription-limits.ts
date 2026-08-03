import {
  CHAT_TEAMMATE_IDS,
  getChatTeammateById,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { UserSubscription } from "@/lib/types";

/** Free-tier AI teammates: General Assistant, Sandy, Arlo, and Theo. */
export const FREE_TIER_AI_TEAMMATE_IDS = [
  "general",
  "sandy",
  "arlo",
  "theo",
] as const satisfies readonly ChatTeammateId[];

/** Premium includes every AI teammate in the product. */
export const PREMIUM_TIER_AI_TEAMMATE_IDS = CHAT_TEAMMATE_IDS;

export type SubscriptionLimitConfig = {
  /** `null` means unlimited. */
  activeProjects: number | null;
  aiChatMessagesPerMonth: number;
  aiTextEnhancementsPerMonth: number;
  aiSummariesPerMonth: number;
  aiTeammateIds: readonly ChatTeammateId[];
};

/**
 * Official plan limits — update values here when tiers change.
 * Usage tracking will read from this config when wired up.
 */
export const SUBSCRIPTION_LIMITS: Record<
  UserSubscription,
  SubscriptionLimitConfig
> = {
  free: {
    activeProjects: 1,
    aiChatMessagesPerMonth: 250,
    aiTextEnhancementsPerMonth: 100,
    aiSummariesPerMonth: 25,
    aiTeammateIds: FREE_TIER_AI_TEAMMATE_IDS,
  },
  premium: {
    activeProjects: null,
    aiChatMessagesPerMonth: 2500,
    aiTextEnhancementsPerMonth: 500,
    aiSummariesPerMonth: 100,
    aiTeammateIds: PREMIUM_TIER_AI_TEAMMATE_IDS,
  },
};

export function getSubscriptionLimits(
  subscription: UserSubscription,
): SubscriptionLimitConfig {
  return SUBSCRIPTION_LIMITS[subscription];
}

export function formatAiTeammateLimitNames(
  teammateIds: readonly ChatTeammateId[],
): string {
  return teammateIds
    .map((id) => getChatTeammateById(id)?.name ?? id)
    .join(", ");
}

export function isUnlimitedActiveProjects(
  subscription: UserSubscription,
): boolean {
  return SUBSCRIPTION_LIMITS[subscription].activeProjects === null;
}
