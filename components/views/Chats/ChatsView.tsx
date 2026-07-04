"use client";

import { Button } from "@/components/ui/Button";

export default function ChatsView() {
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
          <Button type="button" disabled className="shrink-0">
            New Chat
          </Button>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chat management is coming soon. You will be able to start new
            conversations, browse past chats, and continue where you left off.
          </p>
        </div>
      </section>
    </div>
  );
}
