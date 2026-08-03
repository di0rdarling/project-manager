export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function formatCompactDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDisplayDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isSameCalendarDay(
  a: Date | string,
  b: Date | string,
): boolean {
  const dateA = a instanceof Date ? a : new Date(a);
  const dateB = b instanceof Date ? b : new Date(b);

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/** UTC calendar month start for usage limits and billing periods. */
export function getStartOfCurrentMonthUtc(referenceDate: Date = new Date()): Date {
  return new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
}

export function getRelativeDayLabel(
  date: Date | string,
  referenceDate: Date | string,
): "today" | "yesterday" | null {
  const target = date instanceof Date ? date : new Date(date);
  const reference =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  if (isSameCalendarDay(target, reference)) {
    return "today";
  }

  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameCalendarDay(target, yesterday)) {
    return "yesterday";
  }

  return null;
}

export function formatRelativeDate(
  isoDate: string,
  referenceDate: Date | string = new Date(),
): string {
  const target = new Date(isoDate);
  const reference =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  const dayLabel = getRelativeDayLabel(target, reference);
  if (dayLabel) {
    return dayLabel;
  }

  const diffMs = reference.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(diffDays / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
