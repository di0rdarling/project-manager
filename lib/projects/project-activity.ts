import { isSameCalendarDay, toIsoString } from "@/lib/dates";

export type ProjectActivityStatus =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "inactive";

export function getLatestActivityAt(
  ...timestamps: Array<string | Date | null | undefined>
): string {
  let latestMs = Number.NEGATIVE_INFINITY;
  let latest = "";

  for (const timestamp of timestamps) {
    if (timestamp == null) {
      continue;
    }

    const iso = toIsoString(timestamp);
    const ms = new Date(iso).getTime();

    if (Number.isNaN(ms) || ms <= latestMs) {
      continue;
    }

    latestMs = ms;
    latest = iso;
  }

  return latest;
}

export function getProjectActivityStatus(
  lastActivityAt: string,
): ProjectActivityStatus {
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();

  if (isSameCalendarDay(lastActivity, now)) {
    return "today";
  }

  const diffMs = now.getTime() - lastActivity.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    return "thisWeek";
  }

  if (diffDays < 30) {
    return "thisMonth";
  }

  return "inactive";
}

export const projectActivityConfig: Record<
  ProjectActivityStatus,
  { label: string; className: string }
> = {
  today: {
    label: "Active today",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  thisWeek: {
    label: "Active this week",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  thisMonth: {
    label: "Active this month",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  },
  inactive: {
    label: "No recent activity",
    className:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
  },
};
