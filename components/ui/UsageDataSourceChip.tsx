type UsageDataSourceChipProps = {
  isLiveData: boolean;
};

export function UsageDataSourceChip({ isLiveData }: UsageDataSourceChipProps) {
  if (isLiveData) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
      Placeholder
    </span>
  );
}
