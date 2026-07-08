"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";

interface AgentSectionProps {
  title: string;
  description?: string;
  addButtonLabel: string;
  onAddClick: () => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  loadingMessage: string;
  errorFallbackMessage: string;
  isEmpty: boolean;
  emptyMessage: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function AgentSection({
  title,
  description,
  addButtonLabel,
  onAddClick,
  isPending,
  isError,
  error,
  loadingMessage,
  errorFallbackMessage,
  isEmpty,
  emptyMessage,
  defaultExpanded = true,
  children,
}: Readonly<AgentSectionProps>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = `${title.toLowerCase().replace(/\s+/g, "-")}-section-content`;

  function handleAddClick() {
    if (!isExpanded) {
      setIsExpanded(true);
    }

    onAddClick();
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 text-lg font-semibold">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={contentId}
              onClick={() => setIsExpanded((current) => !current)}
              className="cursor-pointer group inline-flex w-full items-center gap-2 rounded-lg py-1 text-left transition hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <ChevronDownIcon
                className={`size-5 shrink-0 text-zinc-500 transition-transform group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden
              />
              {title}
            </button>
          </h2>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddClick}
            className="shrink-0"
          >
            {addButtonLabel}
          </Button>
        </div>
        {description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>

      {isExpanded ? (
        <div id={contentId}>
          {isPending ? (
            <LoadingMessage>{loadingMessage}</LoadingMessage>
          ) : isError ? (
            <ErrorMessage error={error} fallbackMessage={errorFallbackMessage} />
          ) : isEmpty ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {emptyMessage}
              </p>
              <Button type="button" onClick={handleAddClick} className="mt-4">
                {addButtonLabel}
              </Button>
            </div>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  );
}
