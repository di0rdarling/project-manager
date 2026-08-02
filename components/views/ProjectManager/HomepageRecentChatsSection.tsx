"use client";

import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchChats } from "@/hooks/queries/useFetchChats";
import { getChatTeammate } from "@/lib/chats/chat-teammates";
import { formatRelativeDate } from "@/lib/dates";
import type { ChatListItemResponse } from "@/lib/types";

const RECENT_CHATS_LIMIT = 5;

function sortByMostRecent(
  a: ChatListItemResponse,
  b: ChatListItemResponse,
): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function getChatHref(chat: ChatListItemResponse): string {
  const projectId = chat.projectId ?? chat.project?._id ?? null;
  if (projectId) {
    return `/chats/${chat._id}?projectId=${projectId}`;
  }
  return `/chats/${chat._id}`;
}

export default function HomepageRecentChatsSection() {
  const { data: chats = [], isPending, isError, error } = useFetchChats();

  const recentChats = chats
    .filter((chat) => chat.archivedAt === null)
    .sort(sortByMostRecent)
    .slice(0, RECENT_CHATS_LIMIT);

  return (
    <section className="space-y-4">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
        <ChatBubbleLeftRightIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
        Recent chats
      </h2>

      {isPending ? (
        <LoadingMessage>Loading chats...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load chats" />
      ) : recentChats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No chats yet. Pick a teammate above to start your first
            conversation.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recentChats.map((chat) => {
            const teammate = getChatTeammate(chat.teammateId);
            return (
              <li key={chat._id}>
                <Link
                  href={getChatHref(chat)}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <Avatar
                    initials={teammate.avatarInitials}
                    src={teammate.avatarImageSrc}
                    alt={teammate.name}
                    colorClassName={teammate.avatarColorClassName}
                    size="sm"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {chat.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {chat.project?.name ?? "No project"} ·{" "}
                      {formatRelativeDate(chat.updatedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
