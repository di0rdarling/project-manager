"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { CHAT_TEAMMATES } from "@/lib/chat-teammates";

export default function ChatAgentsRow() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">AI Teammates</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Meet the AI assistants you can chat with about your projects.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6">
        {CHAT_TEAMMATES.map((teammate) => (
          <Link
            key={teammate.id}
            href={`/chats/agents/${teammate.id}`}
            aria-label={`View ${teammate.name}'s profile`}
            className="group flex w-32 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-center transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <Avatar
              initials={teammate.avatarInitials}
              src={teammate.avatarImageSrc}
              alt={teammate.name}
              colorClassName={teammate.avatarColorClassName}
              size="md"
              className="size-14 text-base transition group-hover:ring-2 group-hover:ring-zinc-300 dark:group-hover:ring-zinc-700"
            />
            <div className="space-y-0.5">
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {teammate.name}
              </span>
              <span className="block text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                {teammate.role}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
