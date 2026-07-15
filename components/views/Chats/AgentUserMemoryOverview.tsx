"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  deleteItemAction,
  ItemActionsMenu,
  regenerateItemAction,
} from "@/components/ui/ItemActionsMenu";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import AgentAtAGlance from "@/components/views/Chats/AgentAtAGlance";
import AgentConversations from "@/components/views/Chats/AgentConversations";
import AgentKeyDecisions from "@/components/views/Chats/AgentKeyDecisions";
import AgentMostRecently from "@/components/views/Chats/AgentMostRecently";
import AgentOpenThreads from "@/components/views/Chats/AgentOpenThreads";
import AgentStableContext from "@/components/views/Chats/AgentStableContext";
import { useDeleteUserMemory } from "@/hooks/mutations/chats/useDeleteUserMemory";
import { useGenerateUserMemory } from "@/hooks/mutations/chats/useGenerateUserMemory";
import { useFetchUserMemory } from "@/hooks/queries/useFetchUserMemory";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

interface AgentUserMemoryOverviewProps {
  teammateId: ChatTeammateId;
}

export default function AgentUserMemoryOverview({
  teammateId,
}: Readonly<AgentUserMemoryOverviewProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegeneratingRef = useRef(false);
  const { data: userMemory, isFetching } = useFetchUserMemory(teammateId);

  const {
    mutate: generateMemory,
    isPending: isGenerating,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateUserMemory({
    onSuccess: () => {
      toast.success(
        isRegeneratingRef.current
          ? "Overview regenerated successfully."
          : "Overview generated successfully.",
      );
    },
  });
  const deleteMemoryMutation = useDeleteUserMemory({
    onSuccess: () => {
      toast.success("Overview cleared successfully.");
      setIsDeleteModalOpen(false);
    },
  });

  function handleGenerate(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateMemory(teammateId);
  }

  function handleDeleteModalClose() {
    if (deleteMemoryMutation.isPending) {
      return;
    }

    deleteMemoryMutation.reset();
    setIsDeleteModalOpen(false);
  }

  const isInitialLoading = isFetching && userMemory === undefined;
  const openThreads = userMemory?.openThreads ?? [];
  const decisions = userMemory?.decisions ?? [];
  const stableContext = userMemory?.stableContext ?? [];
  const hasAnyData =
    Boolean(userMemory?.mostRecently) ||
    openThreads.length > 0 ||
    decisions.length > 0 ||
    stableContext.length > 0;
  const blockedCount = openThreads.filter(
    (thread) => thread.status === "blocked",
  ).length;

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
        {hasAnyData ? (
          <ItemActionsMenu
            actions={[
              regenerateItemAction(
                "Regenerate overview",
                () => handleGenerate(true),
                isGenerating,
              ),
              deleteItemAction(
                "Clear overview",
                () => setIsDeleteModalOpen(true),
                isGenerating,
              ),
            ]}
          />
        ) : null}
      </div>

      {isInitialLoading ? (
        <LoadingMessage>Loading overview...</LoadingMessage>
      ) : isGenerating ? (
        <LoadingMessage>
          {isRegeneratingRef.current
            ? "Regenerating overview..."
            : "Generating overview..."}
        </LoadingMessage>
      ) : hasAnyData ? (
        <div className="space-y-6">
          {isGenerateError ? (
            <ErrorMessage
              error={generateError}
              fallbackMessage="Failed to regenerate overview"
            />
          ) : null}
          <AgentMostRecently mostRecently={userMemory?.mostRecently ?? null} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <AgentOpenThreads threads={openThreads} />
              <AgentKeyDecisions decisions={decisions} />
            </div>
            <div className="space-y-6">
              <AgentAtAGlance
                chatsCount={null}
                openThreadsCount={openThreads.length}
                blockedCount={blockedCount}
              />
              <AgentStableContext items={stableContext} />
              <AgentConversations />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This fills in automatically as you chat — open threads, decisions,
            and stable context will appear here. You can also generate it now
            from past conversations.
          </p>
          {isGenerateError ? (
            <div className="mt-4 text-left">
              <ErrorMessage
                error={generateError}
                fallbackMessage="Failed to generate overview"
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            className="mt-4"
          >
            Generate overview
          </Button>
        </div>
      )}

      <DeleteAISummaryModal
        open={isDeleteModalOpen}
        title="Clear overview"
        description="Are you sure you want to clear this overview? It will rebuild automatically as you keep chatting, or you can generate a new one anytime."
        confirmLabel="Clear overview"
        pendingLabel="Clearing..."
        isPending={deleteMemoryMutation.isPending}
        error={deleteMemoryMutation.error}
        onClose={handleDeleteModalClose}
        onConfirm={() => deleteMemoryMutation.mutate(teammateId)}
      />
    </section>
  );
}
