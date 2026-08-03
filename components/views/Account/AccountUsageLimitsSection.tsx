"use client";

import {
  getAiUsagePercent,
  getPlaceholderAiUsageLimits,
  type AiUsageLimitCategory,
} from "@/lib/account/ai-usage-limits";
import type { UserSubscription } from "@/lib/types";

type AccountUsageLimitRowProps = {
  category: AiUsageLimitCategory;
};

function getProgressBarClassName(percent: number): string {
  if (percent >= 100) {
    return "bg-red-500";
  }

  if (percent >= 80) {
    return "bg-amber-500";
  }

  return "bg-zinc-900 dark:bg-zinc-100";
}

function AccountUsageLimitRow({ category }: AccountUsageLimitRowProps) {
  const percent = getAiUsagePercent(category.used, category.max);
  const progressBarClassName = getProgressBarClassName(percent);

  return (
    <div className="border-b border-zinc-200 px-4 py-4 last:border-b-0 dark:border-zinc-800">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {category.label}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {category.used} / {category.max}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={category.used}
        aria-valuemin={0}
        aria-valuemax={category.max}
        aria-label={`${category.label}: ${category.used} of ${category.max} used`}
      >
        <div
          className={`h-full rounded-full transition-[width] ${progressBarClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type AccountUsageLimitsSectionProps = {
  subscription: UserSubscription;
};

export default function AccountUsageLimitsSection({
  subscription,
}: AccountUsageLimitsSectionProps) {
  const categories = getPlaceholderAiUsageLimits(subscription);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {categories.map((category) => (
        <AccountUsageLimitRow key={category.key} category={category} />
      ))}
    </div>
  );
}
