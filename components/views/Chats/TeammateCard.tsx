"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatTeammate } from "@/lib/chat-teammates";
import { TeammateProfileLink } from "./TeammateProfileLink";

type TeammateCardProps = {
  teammate: ChatTeammate;
};

export default function TeammateCard({ teammate }: Readonly<TeammateCardProps>) {
  return (
    <TeammateProfileLink
      teammate={teammate}
      className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <Avatar
        initials={teammate.avatarInitials}
        src={teammate.avatarImageSrc}
        alt={teammate.name}
        colorClassName={teammate.avatarColorClassName}
        size="md"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {teammate.name}
        </span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {teammate.role}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 opacity-0 transition group-hover:opacity-100 dark:text-zinc-400">
        View profile
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </span>
    </TeammateProfileLink>
  );
}
