"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageContent from "@/components/layout/PageContent";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  getChatTeammateById,
  getChatTeammatePersonalityTraits,
  isChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  getAgentProfileBackNavigation,
  parseAgentProfileNavigationContext,
} from "@/lib/chats/agent-profile-navigation";
import AIAgentDocumentsSection from "@/components/views/Chats/AIAgentDocumentsSection";
import AIAgentNotesSection from "@/components/views/Chats/AIAgentNotesSection";
import AgentUserMemoryOverview from "@/components/views/Chats/AgentUserMemoryOverview";

interface ChatAgentProfileViewProps {
  teammateId: string;
}

export default function ChatAgentProfileView({
  teammateId,
}: Readonly<ChatAgentProfileViewProps>) {
  const searchParams = useSearchParams();
  const navigationContext = parseAgentProfileNavigationContext(searchParams);
  const backNavigation = getAgentProfileBackNavigation(navigationContext);

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
  const personalityTraits = getChatTeammatePersonalityTraits(teammateId);

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
        <div className="space-y-2">
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
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Personality &amp; approach</h2>
        <ul className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {personalityTraits.map((trait) => (
            <li
              key={trait}
              className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
            >
              {trait}
            </li>
          ))}
        </ul>
      </section>
    </PageContent>
  );
}
