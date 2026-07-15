// Placeholder stats until real chat/thread counts are wired up.
const PLACEHOLDER_STATS = [
  { id: "chats", label: "Chats" },
  { id: "open-threads", label: "Open threads" },
  { id: "blocked", label: "Blocked" },
] as const;

export default function AgentAtAGlance() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        At a glance
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {PLACEHOLDER_STATS.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              –
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
