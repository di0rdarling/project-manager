"use client";

import { useRef } from "react";
import {
  ArrowPathIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";

export type AISummaryMessages = {
  emptyDescription: string;
  generating: string;
  regenerating: string;
  generateError: string;
  regenerateError: string;
};

type AISummarySectionProps = {
  summary: string | null;
  isFetching: boolean;
  isGenerating: boolean;
  isGenerateError: boolean;
  generateError: Error | null;
  isSuccess: boolean;
  messages: AISummaryMessages;
  onGenerate: (isRegenerate: boolean) => void;
  onDeleteClick: () => void;
};

export function AISummarySection({
  summary,
  isFetching,
  isGenerating,
  isGenerateError,
  generateError,
  isSuccess,
  messages,
  onGenerate,
  onDeleteClick,
}: Readonly<AISummarySectionProps>) {
  const isRegeneratingRef = useRef(false);
  const isLoadingSummary =
    isGenerating ||
    (isSuccess && isFetching && summary === null && !isRegeneratingRef.current);

  function handleGenerateClick(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    onGenerate(isRegenerate);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <SparklesIcon
            className="size-5 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          Overview
        </h2>
        {summary ? (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              type="button"
              aria-label="Regenerate summary"
              onClick={() => handleGenerateClick(true)}
              disabled={isGenerating}
            >
              <ArrowPathIcon className="size-4" />
            </IconButton>
            <IconButton
              type="button"
              variant="danger"
              aria-label="Delete summary"
              onClick={onDeleteClick}
              disabled={isGenerating}
            >
              <TrashIcon className="size-4 text-red-500" />
            </IconButton>
          </div>
        ) : null}
      </div>

      {isGenerating ? (
        <LoadingMessage>
          {isRegeneratingRef.current
            ? messages.regenerating
            : messages.generating}
        </LoadingMessage>
      ) : summary ? (
        <>
          {isGenerateError ? (
            <ErrorMessage
              error={generateError}
              fallbackMessage={messages.regenerateError}
            />
          ) : null}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {summary}
            </p>
          </div>
        </>
      ) : isLoadingSummary ? (
        <LoadingMessage>{messages.generating}</LoadingMessage>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {messages.emptyDescription}
          </p>
          {isGenerateError ? (
            <div className="mt-4 text-left">
              <ErrorMessage
                error={generateError}
                fallbackMessage={messages.generateError}
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() => handleGenerateClick(false)}
            disabled={isGenerating}
            className="mt-4"
          >
            Generate Summary
          </Button>
        </div>
      )}
    </section>
  );
}
