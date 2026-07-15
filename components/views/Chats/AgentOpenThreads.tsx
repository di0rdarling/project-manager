type OpenThreadStatus = "blocked" | "to_schedule" | "up_next" | "waiting";

type PlaceholderOpenThread = {
  id: string;
  title: string;
  description: string;
  status: OpenThreadStatus;
  meta: string;
};

// Placeholder rows until open threads are derived from real chat activity.
const PLACEHOLDER_OPEN_THREADS: PlaceholderOpenThread[] = [
  {
    id: "1",
    title: "Placeholder open thread",
    description:
      "A short description of what's blocking or pending on this thread will appear here.",
    status: "blocked",
    meta: "Placeholder project · flagged recently",
  },
  {
    id: "2",
    title: "Placeholder open thread",
    description:
      "Details about an upcoming task or conversation will appear here.",
    status: "up_next",
    meta: "Placeholder project · next up",
  },
  {
    id: "3",
    title: "Placeholder open thread",
    description:
      "Details about a thread waiting on something external will appear here.",
    status: "waiting",
    meta: "Placeholder project · holding",
  },
];

function getStatusBadgeClassName(status: OpenThreadStatus): string {
  switch (status) {
    case "blocked":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200";
    case "up_next":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "to_schedule":
    case "waiting":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
  }
}

function getStatusLabel(status: OpenThreadStatus): string {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "to_schedule":
      return "To schedule";
    case "up_next":
      return "Up next";
    case "waiting":
      return "Waiting";
  }
}

export default function AgentOpenThreads() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Open threads</h2>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
          –
        </span>
      </div>
      <ul className="space-y-3">
        {PLACEHOLDER_OPEN_THREADS.map((thread) => (
          <li
            key={thread.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {thread.title}
                </p>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {thread.description}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClassName(thread.status)}`}
              >
                {getStatusLabel(thread.status)}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              {thread.meta}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
