"use client";

import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { UsageDataSourceChip } from "@/components/ui/UsageDataSourceChip";
import { useFetchAccountUsage } from "@/hooks/queries/useFetchAccountUsage";
import {
  formatAiUsageLimitValue,
  getAiUsageLimits,
  getAiUsagePercent,
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
  const showProgressBar = category.kind === "numeric";

  const percent =
    category.kind === "numeric"
      ? getAiUsagePercent(category.used, category.max)
      : 0;

  const progressBarClassName = getProgressBarClassName(percent);
  const unitLabel =
    category.kind === "numeric" ? category.unitLabel : undefined;

  return (
    <div className="border-b border-zinc-200 px-4 py-4 last:border-b-0 dark:border-zinc-800">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {category.label}
            </span>
            <UsageDataSourceChip
              showPlaceholderChip={category.showPlaceholderChip}
            />
          </div>
          {unitLabel ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {unitLabel}
            </p>
          ) : null}
          {category.kind === "teammates" ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {category.includedLabel}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatAiUsageLimitValue(category)}
        </span>
      </div>

      {showProgressBar ? (
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
      ) : null}

      {category.kind === "teammates" ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Teammates included on your plan
        </p>
      ) : null}

      {category.kind === "unlimited" ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          No project limit on Premium
        </p>
      ) : null}
    </div>
  );
}

type AccountUsageLimitsSectionProps = {
  subscription: UserSubscription;
};

export default function AccountUsageLimitsSection({
  subscription,
}: AccountUsageLimitsSectionProps) {
  const {
    data: accountUsage,
    isPending,
    isError,
    error,
  } = useFetchAccountUsage();

  if (isPending) {
    return <LoadingMessage>Loading usage limits...</LoadingMessage>;
  }

  if (isError || !accountUsage) {
    return (
      <ErrorMessage
        error={error}
        fallbackMessage="Unable to load usage limits"
      />
    );
  }

  const categories = getAiUsageLimits(subscription, {
    activeProjects: accountUsage.activeProjects,
    aiChats: accountUsage.aiChatMessages,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {categories.map((category) => (
        <AccountUsageLimitRow key={category.key} category={category} />
      ))}
    </div>
  );
}
