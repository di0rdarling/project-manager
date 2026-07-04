"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useCreateChat } from "@/hooks/mutations/chats/useCreateChat";
import { useFetchChats } from "@/hooks/queries/useFetchChats";
import ChatsList from "./ChatsList";

export default function ChatsView() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: chats = [],
    isPending,
    isError,
    error,
  } = useFetchChats();

  const createChatMutation = useCreateChat({
    onSuccess: (chat) => {
      router.push(`/chats/${chat._id}`);
    },
    onError: (mutationError) => {
      setIsCreating(false);
      toast.error(mutationError.message);
    },
  });

  function handleCreateChat() {
    setIsCreating(true);
    createChatMutation.mutate();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">AI Chats</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View and manage your conversations with the AI assistant.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="mt-4 text-lg font-semibold">Your chats</h2>
          <Button
            type="button"
            onClick={handleCreateChat}
            disabled={isCreating || createChatMutation.isPending}
            className="shrink-0"
          >
            {isCreating || createChatMutation.isPending
              ? "Creating..."
              : "New Chat"}
          </Button>
        </div>

        {isPending ? (
          <LoadingMessage>Loading chats...</LoadingMessage>
        ) : isError ? (
          <ErrorMessage error={error} fallbackMessage="Failed to load chats" />
        ) : chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No chats yet. Start a new conversation to get help from the AI
              assistant.
            </p>
            <Button
              type="button"
              onClick={handleCreateChat}
              disabled={isCreating || createChatMutation.isPending}
              className="mt-4"
            >
              {isCreating || createChatMutation.isPending
                ? "Creating..."
                : "New Chat"}
            </Button>
          </div>
        ) : (
          <ChatsList
            chats={chats}
            onDeleteSuccess={(chatTitle) =>
              toast.success(`Chat "${chatTitle}" deleted successfully.`)
            }
          />
        )}
      </section>
    </div>
  );
}
