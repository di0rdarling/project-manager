"use client";

import Link from "next/link";
import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { formatDisplayDate } from "@/lib/dates";
import type { ChatResponse } from "@/lib/types";
import DeleteChatModal from "./modals/DeleteChatModal";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ChatsListProps {
  chats: ChatResponse[];
  onDeleteSuccess?: (chatTitle: string) => void;
}

export default function ChatsList({
  chats,
  onDeleteSuccess,
}: Readonly<ChatsListProps>) {
  const [chatToDelete, setChatToDelete] = useState<ChatResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {chats.map((chat) => (
          <li
            key={chat._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/chats/${chat._id}`}
                className="min-w-0 flex-1 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                <h3 className="font-medium">{chat.title}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Last updated {formatDisplayDate(chat.updatedAt)}
                </p>
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
        ))}
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
