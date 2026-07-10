"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchChats } from "@/hooks/queries/useFetchChats";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";
import PageContent from "@/components/layout/PageContent";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import ChatAgentsRow from "./ChatAgentsRow";
import ChatsList from "./ChatsList";
import ChatsToolbar from "./ChatsToolbar";
import CreateChatModal from "./modals/CreateChatModal";

export default function ChatsView() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeammateId, setSelectedTeammateId] = useState<
    ChatTeammateId | ""
  >("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const {
    data: chats = [],
    isPending,
    isError,
    error,
  } = useFetchChats();

  const { data: projects = [] } = useFetchProjects();

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (selectedTeammateId && chat.teammateId !== selectedTeammateId) {
        return false;
      }

      if (selectedProjectId && chat.projectId !== selectedProjectId) {
        return false;
      }

      return true;
    });
  }, [chats, selectedProjectId, selectedTeammateId]);

  const hasActiveFilters =
    selectedTeammateId !== "" || selectedProjectId !== "";

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

  function clearFilters() {
    setSelectedTeammateId("");
    setSelectedProjectId("");
  }

  return (
    <PageContent>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">AI Chats</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your conversations with AI teammates across projects
        </p>
      </div>

      <ChatAgentsRow />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          Chats
        </h2>

        {isPending ? (
          <LoadingMessage>Loading chats...</LoadingMessage>
        ) : isError ? (
          <ErrorMessage error={error} fallbackMessage="Failed to load chats" />
        ) : chats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No chats yet. Start a new conversation to get help from your AI
              teammates.
            </p>
            <Button type="button" onClick={openCreateModal} className="mt-4">
              New chat
            </Button>
          </div>
        ) : (
          <>
            <ChatsToolbar
              selectedTeammateId={selectedTeammateId}
              selectedProjectId={selectedProjectId}
              projects={projects}
              onTeammateChange={setSelectedTeammateId}
              onProjectChange={setSelectedProjectId}
              onNewChat={openCreateModal}
            />

            {filteredChats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {hasActiveFilters
                    ? "No chats match these filters."
                    : "No chats to show."}
                </p>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <ChatsList
                chats={filteredChats}
                onDeleteSuccess={(chatTitle) =>
                  toast.success(`Chat "${chatTitle}" deleted successfully.`)
                }
              />
            )}
          </>
        )}
      </section>

      <CreateChatModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(chatId) => router.push(`/chats/${chatId}`)}
      />
    </PageContent>
  );
}
