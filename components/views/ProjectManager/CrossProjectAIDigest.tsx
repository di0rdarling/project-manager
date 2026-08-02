"use client";

import Link from "next/link";
import { LightBulbIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useGenerateDashboardDigest } from "@/hooks/mutations/dashboard/useGenerateDashboardDigest";
import { getChatTeammate } from "@/lib/chats/chat-teammates";
import { getTeammateProfileHref } from "@/lib/chats/agent-profile-navigation";
import { dashboardKeys } from "@/lib/query-keys";
import type { DashboardDigestResponse } from "@/lib/types";

const jordan = getChatTeammate("jordan");

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
        <div className="flex items-center gap-3">
          <Link
            href={getTeammateProfileHref(jordan.id)}
            className="shrink-0 transition hover:opacity-80"
            aria-label={`View ${jordan.name}'s profile`}
          >
            <Avatar
              initials={jordan.avatarInitials}
              src={jordan.avatarImageSrc}
              alt={jordan.name}
              colorClassName={jordan.avatarColorClassName}
              size="md"
            />
          </Link>
          <div>
            <Link
              href={getTeammateProfileHref(jordan.id)}
              className="inline-flex items-center gap-2 text-lg font-semibold transition hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {jordan.name}&apos;s update
              <SparklesIcon
                className="size-5 text-zinc-500 dark:text-zinc-400"
                aria-hidden
              />
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {jordan.role}
            </p>
          </div>
        </div>
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
        <LoadingMessage>Jordan is reviewing your workspace...</LoadingMessage>
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
            Ask {jordan.name} {" "}for a cross-project update. He&apos;ll synthesize
            your projects, recent notes, and conversations with the other AI
            teammates to surface what matters most.
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
            Ask {jordan.name}
          </Button>
        </div>
      )}
    </section>
  );
}
