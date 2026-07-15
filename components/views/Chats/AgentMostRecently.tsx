type AgentMostRecentlyProps = {
  mostRecently: string | null;
};

export default function AgentMostRecently({
  mostRecently,
}: Readonly<AgentMostRecentlyProps>) {
  if (!mostRecently) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nothing recorded yet — this fills in automatically as you chat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-700 bg-blue-600 p-4 dark:border-blue-800 dark:bg-blue-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-100 dark:text-blue-300">
        Most recently
      </p>
      <p className="mt-1 text-sm leading-relaxed text-white dark:text-blue-50">
        {mostRecently}
      </p>
    </div>
  );
}
