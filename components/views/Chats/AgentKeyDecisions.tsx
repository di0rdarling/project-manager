type PlaceholderDecision = {
  id: string;
  title: string;
  description: string;
  meta: string;
};

// Placeholder rows until key decisions are derived from real chat summaries.
const PLACEHOLDER_DECISIONS: PlaceholderDecision[] = [
  {
    id: "1",
    title: "Placeholder decision",
    description:
      "A short summary of a decision made in a past conversation will appear here.",
    meta: "Decided · Placeholder project",
  },
  {
    id: "2",
    title: "Placeholder decision",
    description:
      "Another decision summary will appear here once this is wired up to real data.",
    meta: "Decided · Placeholder project",
  },
];

export default function AgentKeyDecisions() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Key decisions</h2>
      <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
        {PLACEHOLDER_DECISIONS.map((decision) => (
          <div key={decision.id} className="space-y-1 p-4">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {decision.title}
            </p>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {decision.description}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {decision.meta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
