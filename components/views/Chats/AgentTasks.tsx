import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

type PlaceholderTask = {
  id: string;
  title: string;
  detail: string;
};

// Placeholder rows until tasks are wired to real data.
const PLACEHOLDER_TASKS: PlaceholderTask[] = [
  {
    id: "1",
    title: "Placeholder task",
    detail: "Based on recent conversations",
  },
  {
    id: "2",
    title: "Placeholder task",
    detail: "Based on recent conversations",
  },
  {
    id: "3",
    title: "Placeholder task",
    detail: "Based on recent conversations",
  },
];

export const TASKS_PLACEHOLDER_COUNT = PLACEHOLDER_TASKS.length;

export default function AgentTasks() {
  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ClipboardDocumentCheckIcon className="size-4" aria-hidden />
        Tasks
      </h2>
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
        {PLACEHOLDER_TASKS.map((task) => (
          <li key={task.id} className="flex items-start gap-3 px-4 py-3">
            <ClipboardDocumentCheckIcon
              className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {task.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {task.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
