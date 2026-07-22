import { ChartBarIcon } from "@heroicons/react/24/outline";

type AgentAtAGlanceProps = {
  chatsCount: number | null;
  tasksCount: number;
};

export default function AgentAtAGlance({
  chatsCount,
  tasksCount,
}: Readonly<AgentAtAGlanceProps>) {
  const stats = [
    { id: "chats", label: "Chats", value: chatsCount },
    { id: "tasks", label: "Tasks", value: tasksCount },
  ];

  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ChartBarIcon className="size-4" aria-hidden />
        At a glance
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stat.value ?? "–"}
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
