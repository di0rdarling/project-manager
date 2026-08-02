"use client";

import {
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useGenerateDashboardDigest } from "@/hooks/mutations/dashboard/useGenerateDashboardDigest";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardDigestResponse } from "@/lib/types";

export default function CrossProjectAIDigest() {
  const { data: digest, isFetching: isLoadingDigest } = useQuery<
    DashboardDigestResponse,
    Error
  >({
    queryKey: dashboardKeys.digest,
    staleTime: Infinity,
    enabled: false,
  });

  const {
    mutate: generateDigest,
    isPending: isGenerating,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateDashboardDigest();

  const isBusy = isGenerating || isLoadingDigest;
  const hasDigest = digest != null;

  function handleGenerate() {
    resetGenerate();
    generateDigest();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <SparklesIcon
            className="size-5 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          Cross-project digest
        </h2>
        {hasDigest ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={isBusy}
          >
            Regenerate
          </Button>
        ) : null}
      </div>

      {isGenerating ? (
        <LoadingMessage>Generating cross-project digest...</LoadingMessage>
      ) : hasDigest ? (
        <div className="space-y-4">
          {isGenerateError ? (
            <ErrorMessage
              error={generateError}
              fallbackMessage="Failed to regenerate digest"
            />
          ) : null}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {digest.digest}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <LightBulbIcon
                className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Suggested next action
                </h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  {digest.suggestedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isLoadingDigest ? (
        <LoadingMessage>Loading digest...</LoadingMessage>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Generate an AI-powered overview of what is happening across all your
            projects, plus one concrete next step to take.
          </p>
          {isGenerateError ? (
            <div className="mt-4 text-left">
              <ErrorMessage
                error={generateError}
                fallbackMessage="Failed to generate digest"
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isBusy}
            className="mt-4"
          >
            Generate Digest
          </Button>
        </div>
      )}
    </section>
  );
}
