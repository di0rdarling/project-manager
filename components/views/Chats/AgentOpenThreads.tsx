import type { UserMemoryThread, UserMemoryThreadStatus } from "@/lib/types";

type AgentOpenThreadsProps = {
  threads: UserMemoryThread[];
};

function getStatusBadgeClassName(status: UserMemoryThreadStatus): string {
  switch (status) {
    case "blocked":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200";
    case "up-next":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "tangent":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
    case "to-schedule":
    case "waiting":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
  }
}

function getStatusLabel(status: UserMemoryThreadStatus): string {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "to-schedule":
      return "To schedule";
    case "up-next":
      return "Up next";
    case "waiting":
      return "Waiting";
    case "tangent":
      return "Tangent";
  }
}

export default function AgentOpenThreads({
  threads,
}: Readonly<AgentOpenThreadsProps>) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Open threads</h2>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
          {threads.length}
        </span>
      </div>
      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No open threads right now.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread, index) => (
            <li
              key={`${thread.title}-${index}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {thread.title}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {thread.detail}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClassName(thread.status)}`}
                >
                  {getStatusLabel(thread.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                {thread.project}
                {thread.flaggedDate ? ` · ${thread.flaggedDate}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
