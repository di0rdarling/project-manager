"use client";

import toast from "react-hot-toast";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useGenerateProjectSummary } from "@/hooks/mutations/useGenerateProjectSummary";
import { useFetchProject } from "@/hooks/queries/useFetchProject";

interface AIProjectSummaryProps {
  projectId: string;
}

export default function AIProjectSummary({
  projectId,
}: Readonly<AIProjectSummaryProps>) {
  const { data: project, isFetching } = useFetchProject(projectId);
  const {
    mutate: generateSummary,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  } = useGenerateProjectSummary({
    onSuccess: () => {
      toast.success("Project summary generated successfully.");
    },
  });

  const summary = project?.aiSummary ?? null;
  const isLoadingSummary =
    isPending || (isSuccess && isFetching && summary === null);

  function handleGenerateClick() {
    reset();
    generateSummary(projectId);
  }

  return (
    <section className="space-y-4">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
        <SparklesIcon
          className="size-5 text-zinc-500 dark:text-zinc-400"
          aria-hidden
        />
        Overview
      </h2>

      {summary ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {summary}
          </p>
        </div>
      ) : isLoadingSummary ? (
        <LoadingMessage>Generating project summary...</LoadingMessage>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Generate an AI overview that synthesizes this project&apos;s
            description, requirements, and notes.
          </p>
          {isError ? (
            <div className="mt-4 text-left">
              <ErrorMessage
                error={error}
                fallbackMessage="Failed to generate project summary"
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={handleGenerateClick}
            disabled={isPending}
            className="mt-4"
          >
            Generate Summary
          </Button>
        </div>
      )}
    </section>
  );
}
