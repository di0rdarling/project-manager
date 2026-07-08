export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
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
