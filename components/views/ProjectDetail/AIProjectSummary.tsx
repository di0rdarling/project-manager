"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useGenerateProjectSummary } from "@/hooks/mutations/projects/useGenerateProjectSummary";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import DeleteProjectSummaryModal from "./modals/DeleteProjectSummaryModal";

interface AIProjectSummaryProps {
  projectId: string;
}

export default function AIProjectSummary({
  projectId,
}: Readonly<AIProjectSummaryProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegeneratingRef = useRef(false);
  const { data: project, isFetching } = useFetchProject(projectId);
  const {
    mutate: generateSummary,
    isPending: isGenerating,
    isSuccess,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateProjectSummary({
    onSuccess: () => {
      toast.success(
        isRegeneratingRef.current
          ? "Project summary regenerated successfully."
          : "Project summary generated successfully.",
      );
    },
  });

  const summary = project?.aiSummary ?? null;
  const isLoadingSummary =
    isGenerating ||
    (isSuccess && isFetching && summary === null && !isRegeneratingRef.current);

  function handleGenerateClick(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateSummary(projectId);
  }

  return (
    <>
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
                onClick={() => setIsDeleteModalOpen(true)}
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
              ? "Regenerating project summary..."
              : "Generating project summary..."}
          </LoadingMessage>
        ) : summary ? (
          <>
            {isGenerateError ? (
              <ErrorMessage
                error={generateError}
                fallbackMessage="Failed to regenerate project summary"
              />
            ) : null}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {summary}
              </p>
            </div>
          </>
        ) : isLoadingSummary ? (
          <LoadingMessage>Generating project summary...</LoadingMessage>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Generate an AI overview that synthesizes this project&apos;s
              description, requirements, tools, and notes.
            </p>
            {isGenerateError ? (
              <div className="mt-4 text-left">
                <ErrorMessage
                  error={generateError}
                  fallbackMessage="Failed to generate project summary"
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

      <DeleteProjectSummaryModal
        open={isDeleteModalOpen}
        projectId={projectId}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => toast.success("Project summary deleted successfully.")}
      />
    </>
  );
}
