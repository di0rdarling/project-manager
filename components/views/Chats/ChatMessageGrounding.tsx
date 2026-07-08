import type { ChatMessageResponse } from "@/lib/types";

function ChatMessageGrounding({
  message,
}: {
  message: Pick<
    ChatMessageResponse,
    "sources" | "webSearchQueries" | "searchSuggestionsHtml"
  >;
}) {
  const hasSources = Boolean(message.sources?.length);
  const hasQueries = Boolean(message.webSearchQueries?.length);
  const hasSearchSuggestions = Boolean(message.searchSuggestionsHtml);

  if (!hasSources && !hasQueries && !hasSearchSuggestions) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      {hasQueries ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Web searches
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
            {message.webSearchQueries?.map((query) => (
              <li key={query}>{query}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSources ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Sources
          </p>
          <ul className="mt-1 space-y-1">
            {message.sources?.map((source) => (
              <li key={source.uri}>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400"
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSearchSuggestions ? (
        <div
          className="text-xs text-zinc-600 dark:text-zinc-400 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400"
          // Google requires displaying search suggestions when grounding is used.
          dangerouslySetInnerHTML={{
            __html: message.searchSuggestionsHtml ?? "",
          }}
        />
      ) : null}
    </div>
  );
}

export default ChatMessageGrounding;
