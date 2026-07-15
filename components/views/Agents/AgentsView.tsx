"use client";

import PageContent from "@/components/layout/PageContent";
import ChatAgentsRow from "@/components/views/Chats/ChatAgentsRow";

export default function AgentsView() {
  return (
    <PageContent>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Agents</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your AI teammates and their roles across projects
        </p>
      </div>

      <ChatAgentsRow />
    </PageContent>
  );
}
