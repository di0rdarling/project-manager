import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

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
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ChatBubbleLeftEllipsisIcon className="size-4" aria-hidden />
        Conversations
      </h2>
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
        {PLACEHOLDER_CONVERSATIONS.map((conversation) => (
          <li
            key={conversation.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <ChatBubbleLeftEllipsisIcon
              className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {conversation.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {conversation.relativeLabel}
              </p>
            </div>
            <ArrowTopRightOnSquareIcon
              className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
