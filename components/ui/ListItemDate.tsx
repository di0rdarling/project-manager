import { formatDisplayDate } from "@/lib/dates";

type ListItemDateProps = {
  dateTime: string;
  className?: string;
};

export function ListItemDate({
  dateTime,
  className = "text-xs text-zinc-500 dark:text-zinc-400",
}: Readonly<ListItemDateProps>) {
  return (
    <time dateTime={dateTime} className={className}>
      {formatDisplayDate(dateTime)}
    </time>
  );
}
