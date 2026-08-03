"use client";

import type { ReactNode } from "react";

type AgentSideChatPanelAsideProps = {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  /** When true, use row layout at lg+ (modal). Default xl matches full-page review. */
  compact?: boolean;
};

export function AgentSideChatPanelAside({
  header,
  children,
  footer,
  compact = false,
}: Readonly<AgentSideChatPanelAsideProps>) {
  const widthClass = compact
    ? "lg:w-full lg:max-w-none"
    : "xl:w-full xl:max-w-none 2xl:w-full 2xl:max-w-none";
  const borderClass = compact
    ? "border-t border-zinc-200 dark:border-zinc-800 lg:border-l lg:border-t-0"
    : "border-t border-zinc-200 dark:border-zinc-800 xl:border-l xl:border-t-0";

  const heightClass = compact
    ? "min-h-[420px] lg:min-h-0 lg:flex-1"
    : "min-h-[420px] xl:min-h-0 xl:flex-1";

  return (
    <aside
      className={`flex w-full min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-zinc-950 ${compact ? "min-w-0" : "xl:shrink-0"} ${heightClass} ${widthClass} ${borderClass}`}
    >
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {header}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

      <div className="shrink-0 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {footer}
      </div>
    </aside>
  );
}
