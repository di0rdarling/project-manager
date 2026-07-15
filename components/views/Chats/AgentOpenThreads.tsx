import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import type { UserMemoryThread, UserMemoryThreadStatus } from "@/lib/types";

type AgentOpenThreadsProps = {
  threads: UserMemoryThread[];
};

function getStatusDotClassName(status: UserMemoryThreadStatus): string {
  switch (status) {
    case "blocked":
      return "bg-red-500";
    case "to-schedule":
      return "bg-orange-500";
    case "up-next":
      return "bg-yellow-400";
    case "tangent":
      return "bg-violet-500";
    case "waiting":
      return "bg-zinc-400 dark:bg-zinc-500";
  }
}

function getStatusBadgeClassName(status: UserMemoryThreadStatus): string {
  switch (status) {
    case "blocked":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    case "to-schedule":
      return "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300";
    case "up-next":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200";
    case "tangent":
      return "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300";
    case "waiting":
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300";
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <ClipboardDocumentListIcon className="size-4" aria-hidden />
          Open threads
        </h2>
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
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${getStatusDotClassName(thread.status)}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {thread.title}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClassName(thread.status)}`}
                    >
                      {getStatusLabel(thread.status)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {thread.detail}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {thread.project}
                    {thread.flaggedDate ? ` · ${thread.flaggedDate}` : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
