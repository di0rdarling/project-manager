"use client";

import type { ReactNode } from "react";

type ContentWithChatLayoutProps = {
  content: ReactNode;
  chatPanel: ReactNode;
  /** When true, use row layout at lg+ (modal). Default xl matches full-page review. */
  compact?: boolean;
  className?: string;
  contentClassName?: string;
};

export function ContentWithChatLayout({
  content,
  chatPanel,
  compact = false,
  className = "",
  contentClassName = "",
}: Readonly<ContentWithChatLayoutProps>) {
  const rowBreakpoint = compact ? "lg:flex-row" : "xl:flex-row";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${rowBreakpoint} items-stretch overflow-hidden ${className}`}
    >
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${compact ? "lg:basis-0" : ""} ${contentClassName}`}
      >
        {content}
      </div>
      <div
        className={`min-h-0 ${
          compact
            ? "lg:flex lg:min-h-0 lg:flex-1 lg:basis-0 lg:flex-col lg:self-stretch"
            : "shrink-0 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:self-stretch"
        }`}
      >
        {chatPanel}
      </div>
    </div>
  );
}
