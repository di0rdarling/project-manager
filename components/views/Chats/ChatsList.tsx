"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ContextTag } from "@/components/ui/ContextTag";
import { deleteItemAction, ItemActionsMenu } from "@/components/ui/ItemActionsMenu";
import { getChatTeammate } from "@/lib/chat-teammates";
import { formatCompactDisplayDate } from "@/lib/dates";
import type { ChatListItemResponse } from "@/lib/types";
import DeleteChatModal from "./modals/DeleteChatModal";

interface ChatsListProps {
  chats: ChatListItemResponse[];
  onDeleteSuccess?: (chatTitle: string) => void;
}

function getChatSnippet(chat: ChatListItemResponse): string | null {
  if (chat.conversationSummary?.trim()) {
    return chat.conversationSummary.trim();
  }

  return null;
}

export default function ChatsList({
  chats,
  onDeleteSuccess,
}: Readonly<ChatsListProps>) {
  const [chatToDelete, setChatToDelete] = useState<ChatListItemResponse | null>(
    null,
  );

  return (
    <>
      <ul className="space-y-3">
        {chats.map((chat) => {
          const teammate = getChatTeammate(chat.teammateId);
          const snippet = getChatSnippet(chat);

          return (
            <li
              key={chat._id}
              className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/chats/${chat._id}`}
                  className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      initials={teammate.avatarInitials}
                      src={teammate.avatarImageSrc}
                      alt={teammate.name}
                      colorClassName={teammate.avatarColorClassName}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />
                    <h3 className="min-w-0 font-medium text-zinc-900 dark:text-zinc-100">
                      {chat.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-3 pl-11">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ContextTag className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {teammate.name}
                      </ContextTag>
                      {chat.project ? (
                        <ContextTag className="bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100">
                          {chat.project.name}
                        </ContextTag>
                      ) : null}
                      {chat.requirement ? (
                        <ContextTag className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {chat.requirement.title}
                        </ContextTag>
                      ) : null}
                      {chat.feature ? (
                        <ContextTag className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {chat.feature.title}
                        </ContextTag>
                      ) : null}
                    </div>
                    <time
                      dateTime={chat.updatedAt}
                      className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      {formatCompactDisplayDate(chat.updatedAt)}
                    </time>
                  </div>

                  {snippet ? (
                    <p className="line-clamp-2 pl-11 text-sm text-zinc-500 dark:text-zinc-400">
                      {snippet}
                    </p>
                  ) : null}
                </Link>
                <ItemActionsMenu
                  actions={[
                    deleteItemAction(`Delete ${chat.title}`, () =>
                      setChatToDelete(chat),
                    ),
                  ]}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <DeleteChatModal
        open={chatToDelete !== null}
        chat={chatToDelete}
        onClose={() => setChatToDelete(null)}
        onSuccess={(chatTitle) => onDeleteSuccess?.(chatTitle)}
      />
    </>
  );
}
