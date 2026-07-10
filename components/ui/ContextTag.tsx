import type { ReactNode } from "react";

/**
 * Compact, non-interactive pill for contextual metadata on list items and cards.
 *
 * Use ContextTag when you need to show what an item is related to — e.g. a
 * teammate, project, requirement, or feature — without implying state or
 * offering an action. Typical placement is a metadata row beneath a title,
 * often alongside a date or other secondary info.
 *
 * Reuse this instead of hand-rolling `rounded-full px-2.5 py-0.5 text-xs`
 * spans so truncation, sizing, and layout stay consistent across pages.
 *
 * Good fits elsewhere in the app:
 * - Project or note list items that surface a parent project or section
 * - Detail views showing linked entities (requirement on a feature, etc.)
 * - Any card footer that groups short, read-only context labels
 *
 * Not for:
 * - Status or priority badges (open/closed, high/low) — those carry semantic
 *   meaning and usually deserve their own color helpers
 * - Filter or navigation controls — use FilterPill or a link/button instead
 *
 * Styling: pass grayscale zinc `className` values to differentiate tag types
 * (e.g. a slightly stronger shade for the primary context). Keep labels short;
 * long text is truncated automatically.
 */
type ContextTagProps = {
  children: ReactNode;
  className?: string;
};

export function ContextTag({ children, className }: Readonly<ContextTagProps>) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? ""}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
