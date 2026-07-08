"use client";

import { useRef } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  deleteItemAction,
  ItemActionsMenu,
  regenerateItemAction,
} from "@/components/ui/ItemActionsMenu";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useRegisterProjectSection } from "@/hooks/useRegisterProjectSection";
import type { ProjectDetailSectionId } from "@/lib/project-detail-sections";

export type AISummaryMessages = {
  emptyDescription: string;
  generating: string;
  regenerating: string;
  generateError: string;
  regenerateError: string;
};

type AISummarySectionProps = {
  summary: string | null;
  title?: string;
  sectionId?: ProjectDetailSectionId;
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
  title = "Overview",
  sectionId,
  isFetching,
  isGenerating,
  isGenerateError,
  generateError,
  isSuccess,
  messages,
  onGenerate,
  onDeleteClick,
}: Readonly<AISummarySectionProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const isRegeneratingRef = useRef(false);

  useRegisterProjectSection(sectionId, sectionRef);
  const isLoadingSummary =
    isGenerating ||
    (isSuccess && isFetching && summary === null && !isRegeneratingRef.current);

  function handleGenerateClick(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    onGenerate(isRegenerate);
  }

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className="scroll-mt-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <SparklesIcon
            className="size-5 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          {title}
        </h2>
        {summary ? (
          <ItemActionsMenu
            actions={[
              regenerateItemAction(
                "Regenerate summary",
                () => handleGenerateClick(true),
                isGenerating,
              ),
              deleteItemAction("Delete summary", onDeleteClick, isGenerating),
            ]}
          />
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
