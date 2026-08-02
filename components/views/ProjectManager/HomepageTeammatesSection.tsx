"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CHAT_TEAMMATES_FOR_DISPLAY } from "@/lib/chats/chat-teammates";
import { getTeammateProfileHref } from "@/lib/chats/agent-profile-navigation";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import CreateChatModal from "@/components/views/Chats/modals/CreateChatModal";
import ProjectSelectModal from "@/components/views/Chats/modals/ProjectSelectModal";

export default function HomepageTeammatesSection() {
  const router = useRouter();
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [selectedTeammateId, setSelectedTeammateId] =
    useState<ChatTeammateId>("general");
  const [chatProjectId, setChatProjectId] = useState<string | null>(null);

  function handleChatClick(teammateId: ChatTeammateId) {
    setSelectedTeammateId(teammateId);
    setIsProjectSelectOpen(true);
  }

  function handleProjectSelected(projectId: string) {
    setChatProjectId(projectId);
    setIsProjectSelectOpen(false);
    setIsCreateChatOpen(true);
  }

  function handleChatCreated(chatId: string) {
    if (chatProjectId) {
      router.push(`/chats/${chatId}?projectId=${chatProjectId}`);
    } else {
      router.push(`/chats/${chatId}`);
    }
  }

  const selectedTeammate = CHAT_TEAMMATES_FOR_DISPLAY.find(
    (t) => t.id === selectedTeammateId,
  );

  return (
    <section className="space-y-4">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
        <ChatBubbleLeftRightIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
        Teammates
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHAT_TEAMMATES_FOR_DISPLAY.map((teammate) => (
          <div
            key={teammate.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Link
              href={getTeammateProfileHref(teammate.id)}
              className="shrink-0 transition hover:opacity-80"
              aria-label={`View ${teammate.name}'s profile`}
            >
              <Avatar
                initials={teammate.avatarInitials}
                src={teammate.avatarImageSrc}
                alt={teammate.name}
                colorClassName={teammate.avatarColorClassName}
                size="md"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={getTeammateProfileHref(teammate.id)}
                className="block truncate text-sm font-medium text-zinc-900 transition hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {teammate.name}
              </Link>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {teammate.role}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 px-3 py-1.5 text-xs"
              onClick={() => handleChatClick(teammate.id)}
            >
              Chat
            </Button>
          </div>
        ))}
      </div>

      <ProjectSelectModal
        open={isProjectSelectOpen}
        onClose={() => setIsProjectSelectOpen(false)}
        onSelect={handleProjectSelected}
        title={
          selectedTeammate
            ? `Start a chat with ${selectedTeammate.name}`
            : "Start a chat"
        }
      />

      {chatProjectId ? (
        <CreateChatModal
          open={isCreateChatOpen}
          onClose={() => setIsCreateChatOpen(false)}
          onSuccess={handleChatCreated}
          projectId={chatProjectId}
          defaultTeammateId={selectedTeammateId}
        />
      ) : null}
    </section>
  );
}
