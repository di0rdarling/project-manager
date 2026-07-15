type PlaceholderConversation = {
  id: string;
  title: string;
  relativeLabel: string;
};

// Placeholder rows until the recent conversations list is wired to real chats.
const PLACEHOLDER_CONVERSATIONS: PlaceholderConversation[] = [
  { id: "1", title: "Placeholder conversation", relativeLabel: "–" },
  { id: "2", title: "Placeholder conversation", relativeLabel: "–" },
  { id: "3", title: "Placeholder conversation", relativeLabel: "–" },
];

export default function AgentConversations() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Conversations
      </h2>
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
        {PLACEHOLDER_CONVERSATIONS.map((conversation) => (
          <li
            key={conversation.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="truncate text-sm text-zinc-800 dark:text-zinc-100">
              {conversation.title}
            </span>
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-500">
              {conversation.relativeLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
