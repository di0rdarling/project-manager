import { MapPinIcon } from "@heroicons/react/24/outline";

type AgentStableContextProps = {
  items: string[];
};

export default function AgentStableContext({
  items,
}: Readonly<AgentStableContextProps>) {
  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <MapPinIcon className="size-4" aria-hidden />
        Stable context
      </h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No stable context yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                {item}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
