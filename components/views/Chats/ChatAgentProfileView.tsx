"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageContent from "@/components/layout/PageContent";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  getChatTeammateById,
  isChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  getAgentProfileBackNavigation,
  getChatDetailHref,
  parseAgentProfileNavigationContext,
} from "@/lib/chats/agent-profile-navigation";
import AIAgentDocumentsSection from "@/components/views/Chats/AIAgentDocumentsSection";
import AIAgentNotesSection from "@/components/views/Chats/AIAgentNotesSection";
import AgentUserMemoryOverview from "@/components/views/Chats/AgentUserMemoryOverview";
import CreateChatModal from "@/components/views/Chats/modals/CreateChatModal";
import ProjectSelectModal from "@/components/views/Chats/modals/ProjectSelectModal";

interface ChatAgentProfileViewProps {
  teammateId: string;
}

export default function ChatAgentProfileView({
  teammateId,
}: Readonly<ChatAgentProfileViewProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigationContext = parseAgentProfileNavigationContext(searchParams);
  const backNavigation = getAgentProfileBackNavigation(navigationContext);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [chatProjectId, setChatProjectId] = useState<string | null>(null);

  function handleStartChat() {
    setIsProjectSelectOpen(true);
  }

  function handleProjectSelected(projectId: string) {
    setChatProjectId(projectId);
    setIsProjectSelectOpen(false);
    setIsCreateChatOpen(true);
  }

  function handleChatCreated(chatId: string) {
    if (chatProjectId) {
      router.push(getChatDetailHref(chatId, chatProjectId));
    } else {
      router.push(`/chats/${chatId}`);
    }
  }

  if (!isChatTeammateId(teammateId)) {
    return (
      <PageContent className="gap-6">
        <Link
          href={backNavigation.href}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {backNavigation.label}
        </Link>
        <ErrorMessage error={null} fallbackMessage="AI teammate not found" />
      </PageContent>
    );
  }

  const teammate = getChatTeammateById(teammateId)!;

  return (
    <PageContent>
      <Link
        href={backNavigation.href}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {backNavigation.label}
      </Link>


      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar
          initials={teammate.avatarInitials}
          src={teammate.avatarImageSrc}
          alt={teammate.name}
          colorClassName={teammate.avatarColorClassName}
          size="md"
          className="size-20 text-xl"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            AI Teammate
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{teammate.name}</h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            {teammate.role}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {teammate.description}
          </p>
        </div>
        <Button type="button" onClick={handleStartChat} className="shrink-0">
          Start chat
        </Button>
      </div>

      <AgentUserMemoryOverview
        teammateId={teammateId}
        projectId={navigationContext.projectId}
      />

      <AIAgentNotesSection
        teammateId={teammateId}
        agentName={teammate.name}
        profileFrom={navigationContext.from}
        profileProjectId={navigationContext.projectId}
      />

      <AIAgentDocumentsSection
        teammateId={teammateId}
        agentName={teammate.name}
        profileFrom={navigationContext.from}
        profileProjectId={navigationContext.projectId}
      />

      <ProjectSelectModal
        open={isProjectSelectOpen}
        onClose={() => setIsProjectSelectOpen(false)}
        onSelect={handleProjectSelected}
        title={`Start a chat with ${teammate.name}`}
        defaultProjectId={navigationContext.projectId}
      />

      {chatProjectId ? (
        <CreateChatModal
          open={isCreateChatOpen}
          onClose={() => setIsCreateChatOpen(false)}
          onSuccess={handleChatCreated}
          projectId={chatProjectId}
          defaultTeammateId={teammateId}
        />
      ) : null}
    </PageContent>
  );
}
