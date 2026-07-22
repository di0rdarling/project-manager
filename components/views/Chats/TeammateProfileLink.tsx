"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatTeammate } from "@/lib/chats/chat-teammates";
import {
  getTeammateProfileHref,
  type AgentProfileFrom,
} from "@/lib/chats/agent-profile-navigation";

type TeammateProfileLinkProps = {
  teammate: ChatTeammate;
  children: ReactNode;
  className?: string;
  from?: AgentProfileFrom | null;
  projectId?: string | null;
};

export function TeammateProfileLink({
  teammate,
  children,
  className,
  from,
  projectId,
}: TeammateProfileLinkProps) {
  return (
    <Link
      href={getTeammateProfileHref(teammate.id, from, projectId)}
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
  from?: AgentProfileFrom | null;
  projectId?: string | null;
};

export function TeammateProfileAvatarLink({
  teammate,
  size = "sm",
  className,
  from,
  projectId,
}: TeammateProfileAvatarLinkProps) {
  return (
    <TeammateProfileLink
      teammate={teammate}
      from={from}
      projectId={projectId}
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
