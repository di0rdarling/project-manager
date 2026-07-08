"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { getChatTeammate } from "@/lib/chat-teammates";
import { formatDisplayDate } from "@/lib/dates";
import type { ChatListItemResponse } from "@/lib/types";
import DeleteChatModal from "./modals/DeleteChatModal";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ChatsListProps {
  chats: ChatListItemResponse[];
  onDeleteSuccess?: (chatTitle: string) => void;
}

function ChatContextLabel({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className: string;
}>) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
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

          return (
            <li
              key={chat._id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/chats/${chat._id}`}
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <Avatar
                    initials={teammate.avatarInitials}
                    src={teammate.avatarImageSrc}
                    alt={teammate.name}
                    colorClassName={teammate.avatarColorClassName}
                    size="sm"
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <h3 className="font-medium">{chat.title}</h3>
                    {chat.project || chat.requirement || chat.feature ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {chat.project ? (
                          <ChatContextLabel className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {chat.project.name}
                          </ChatContextLabel>
                        ) : null}
                        {chat.requirement ? (
                          <ChatContextLabel className="bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                            {chat.requirement.title}
                          </ChatContextLabel>
                        ) : null}
                        {chat.feature ? (
                          <ChatContextLabel className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                            {chat.feature.title}
                          </ChatContextLabel>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {teammate.name} · Last updated{" "}
                      {formatDisplayDate(chat.updatedAt)}
                    </p>
                  </span>
                </Link>
                <div className="flex shrink-0 items-start gap-1">
                  <IconButton
                    type="button"
                    variant="danger"
                    aria-label={`Delete ${chat.title}`}
                    onClick={() => setChatToDelete(chat)}
                  >
                    <TrashIcon className="size-4 text-red-500" />
                  </IconButton>
                </div>
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
