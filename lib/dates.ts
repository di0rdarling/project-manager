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
