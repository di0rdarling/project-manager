"use client";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import {
  TeammateProfileAvatarLink,
} from "@/components/views/Chats/TeammateProfileLink";
import { formatDisplayDateTime } from "@/lib/dates";
import { getChatTeammate, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentProfileFrom } from "@/lib/chats/agent-profile-navigation";
import type { ChatMessageRole } from "@/lib/types";

export type AgentChatMessage = {
  _id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

type AgentChatMessageBubbleProps = {
  message: AgentChatMessage;
  teammateId: ChatTeammateId;
  projectId?: string | null;
  profileFrom?: AgentProfileFrom | null;
};

export function AgentChatMessageBubble({
  message,
  teammateId,
  projectId = null,
  profileFrom = "agents",
}: Readonly<AgentChatMessageBubbleProps>) {
  const teammate = getChatTeammate(teammateId);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-2xl bg-zinc-900 px-3 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          <MarkdownContent content={message.content} variant="inverted" />
          <div className="mt-1.5 flex items-center justify-end gap-1">
            <time
              dateTime={message.createdAt}
              className="text-xs text-zinc-300 dark:text-zinc-600"
            >
              {formatDisplayDateTime(message.createdAt)}
            </time>
            <CopyToClipboardButton
              text={message.content}
              ariaLabel="Copy your message"
              className="p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white dark:text-zinc-600 dark:hover:bg-zinc-200 dark:hover:text-zinc-900"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <TeammateProfileAvatarLink
        teammate={teammate}
        size="sm"
        className="mt-1 shrink-0"
        from={profileFrom}
        projectId={projectId}
      />
      <div className="max-w-[90%] rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <MarkdownContent content={message.content} variant="default" />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <time
            dateTime={message.createdAt}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatDisplayDateTime(message.createdAt)}
          </time>
          <CopyToClipboardButton
            text={message.content}
            ariaLabel={`Copy ${teammate.name}'s response`}
            className="p-1"
          />
        </div>
      </div>
    </div>
  );
}

export function AgentChatTypingIndicator({
  teammateId,
  projectId = null,
  profileFrom = "agents",
}: Readonly<{
  teammateId: ChatTeammateId;
  projectId?: string | null;
  profileFrom?: AgentProfileFrom | null;
}>) {
  const teammate = getChatTeammate(teammateId);

  return (
    <div className="flex items-start gap-2.5">
      <TeammateProfileAvatarLink
        teammate={teammate}
        size="sm"
        className="mt-1 shrink-0"
        from={profileFrom}
        projectId={projectId}
      />
      <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Thinking...
      </div>
    </div>
  );
}
