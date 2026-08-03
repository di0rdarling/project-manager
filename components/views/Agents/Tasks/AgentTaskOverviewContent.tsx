"use client";

import {
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import type { AgentTask } from "@/lib/types";

export type AgentTaskDetailBlock = {
  key: string;
  label: string;
  icon: typeof LightBulbIcon;
  value: string;
  iconClassName: string;
};

export function buildAgentTaskDetailBlocks(task: AgentTask): AgentTaskDetailBlock[] {
  return [
    {
      key: "rationale",
      label: "Why I'm suggesting this",
      icon: LightBulbIcon,
      value: task.rationale,
      iconClassName: "text-amber-500 dark:text-amber-400",
    },
    {
      key: "impact",
      label: "Impact if this gets done",
      icon: ArrowTrendingUpIcon,
      value: task.impact,
      iconClassName: "text-emerald-500 dark:text-emerald-400",
    },
    {
      key: "risk",
      label: "If this is skipped",
      icon: ExclamationTriangleIcon,
      value: task.riskIfSkipped,
      iconClassName: "text-red-500 dark:text-red-400",
    },
  ];
}

export function AgentTaskOverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AgentTaskOverviewContentProps = {
  task: AgentTask;
  blocks?: AgentTaskDetailBlock[];
  isGeneratingAlternative?: boolean;
};

export function AgentTaskOverviewContent({
  task,
  blocks = buildAgentTaskDetailBlocks(task),
  isGeneratingAlternative = false,
}: Readonly<AgentTaskOverviewContentProps>) {
  if (isGeneratingAlternative) {
    return <AgentTaskOverviewSkeleton />;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {task.detail}
      </p>

      {task.outputDescription ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <DocumentTextIcon
              className="size-4 shrink-0 text-blue-500 dark:text-blue-400"
              aria-hidden
            />
            What I&apos;ll produce
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {task.outputDescription}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {blocks.map(({ key, label, icon: Icon, value, iconClassName }) =>
          value ? (
            <div
              key={key}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <Icon
                  className={`size-4 shrink-0 ${iconClassName}`}
                  aria-hidden
                />
                {label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {value}
              </p>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
