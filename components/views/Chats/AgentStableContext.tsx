// Placeholder cards until stable, long-lived context facts are captured.
const PLACEHOLDER_CONTEXT_ITEMS = [
  {
    id: "1",
    title: "Stable context",
    description:
      "Long-lived facts and working preferences for this teammate — like schedules, ground rules, or ongoing constraints — will show up here.",
  },
  {
    id: "2",
    title: "More context",
    description:
      "Additional stable context will appear here as it's captured from your conversations.",
  },
] as const;

export default function AgentStableContext() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Stable context
      </h2>
      <div className="space-y-3">
        {PLACEHOLDER_CONTEXT_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
