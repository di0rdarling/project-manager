"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatTeammate } from "@/lib/chat-teammates";

type TeammateProfileLinkProps = {
  teammate: ChatTeammate;
  children: ReactNode;
  className?: string;
};

function getTeammateProfileHref(teammateId: ChatTeammate["id"]): string {
  return `/chats/agents/${teammateId}`;
}

export function TeammateProfileLink({
  teammate,
  children,
  className,
}: TeammateProfileLinkProps) {
  return (
    <Link
      href={getTeammateProfileHref(teammate.id)}
      aria-label={`View ${teammate.name}'s profile`}
      className={className}
    >
      {children}
    </Link>
  );
}

type TeammateProfileAvatarLinkProps = {
  teammate: ChatTeammate;
  size?: "sm" | "md";
  className?: string;
};

export function TeammateProfileAvatarLink({
  teammate,
  size = "sm",
  className,
}: TeammateProfileAvatarLinkProps) {
  return (
    <TeammateProfileLink
      teammate={teammate}
      className={`inline-flex shrink-0 rounded-full transition hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-700 ${className ?? ""}`}
    >
      <Avatar
        initials={teammate.avatarInitials}
        src={teammate.avatarImageSrc}
        alt={teammate.name}
        colorClassName={teammate.avatarColorClassName}
        size={size}
      />
    </TeammateProfileLink>
  );
}
