// Placeholder until "most recently" is derived from real chat/thread activity.
export default function AgentMostRecently() {
  return (
    <div className="rounded-2xl border border-blue-700 bg-blue-600 p-4 dark:border-blue-800 dark:bg-blue-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-100 dark:text-blue-300">
        Most recently
      </p>
      <p className="mt-1 text-sm leading-relaxed text-white dark:text-blue-50">
        Placeholder — a short recap of what changed most recently across this
        teammate&apos;s threads and conversations will appear here.
      </p>
    </div>
  );
}
