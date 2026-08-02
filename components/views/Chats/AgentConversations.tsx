"use client";

import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import {
  formatConversationRelativeLabel,
  getRecentAgentChats,
} from "@/lib/chats/agent-chats";
import { getChatDetailHref } from "@/lib/chats/agent-profile-navigation";
import type { ChatListItemResponse } from "@/lib/types";

type AgentConversationsProps = {
  conversations: ChatListItemResponse[];
  isPending?: boolean;
  projectId?: string | null;
};

function getConversationHref(
  chat: ChatListItemResponse,
  projectId?: string | null,
): string {
  const resolvedProjectId =
    projectId ?? chat.projectId ?? chat.project?._id ?? null;

  if (resolvedProjectId) {
    return getChatDetailHref(chat._id, resolvedProjectId);
  }

  return `/chats/${chat._id}`;
}

export default function AgentConversations({
  conversations,
  isPending = false,
  projectId,
}: Readonly<AgentConversationsProps>) {
  const recentConversations = getRecentAgentChats(conversations);

  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ChatBubbleLeftEllipsisIcon className="size-4" aria-hidden />
        Conversations
      </h2>
      {isPending ? (
        <LoadingMessage>Loading conversations...</LoadingMessage>
      ) : recentConversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No conversations yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          {recentConversations.map((conversation) => (
            <li key={conversation._id}>
              <Link
                href={getConversationHref(conversation, projectId)}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <ChatBubbleLeftEllipsisIcon
                  className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {formatConversationRelativeLabel(conversation.updatedAt)}
                  </p>
                </div>
                <ArrowTopRightOnSquareIcon
                  className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
