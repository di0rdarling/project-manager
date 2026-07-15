import type { UserMemoryDecision } from "@/lib/types";

type AgentKeyDecisionsProps = {
  decisions: UserMemoryDecision[];
};

export default function AgentKeyDecisions({
  decisions,
}: Readonly<AgentKeyDecisionsProps>) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Key decisions</h2>
      {decisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No decisions recorded yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          {decisions.map((decision, index) => (
            <div key={`${decision.topic}-${index}`} className="space-y-1 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {decision.topic}
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {decision.choice}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Decided · {decision.project}
                {decision.when ? ` · ${decision.when}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
