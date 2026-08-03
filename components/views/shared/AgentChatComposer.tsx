"use client";

import { Button } from "@/components/ui/Button";
import { ChatContextUsageIndicator } from "@/components/views/Chats/ChatContextUsageIndicator";
import type { ChatContextUsage } from "@/lib/types";

type AgentChatComposerProps = {
  teammateName: string;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isSending: boolean;
  isDisabled?: boolean;
  contextUsage?: ChatContextUsage | null;
  isAtContextLimit?: boolean;
};

export function AgentChatComposer({
  teammateName,
  message,
  onMessageChange,
  onSend,
  onSubmit,
  onKeyDown,
  isSending,
  isDisabled = false,
  contextUsage = null,
  isAtContextLimit = false,
}: Readonly<AgentChatComposerProps>) {
  if (isAtContextLimit) {
    return (
      <div className="flex items-center gap-3">
        {contextUsage ? (
          <ChatContextUsageIndicator usage={contextUsage} />
        ) : null}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This conversation is read-only because it has reached the context
          limit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={`Message ${teammateName}...`}
        rows={3}
        disabled={isSending || isDisabled}
        className="w-full resize-none rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-400"
      />
      <div className="flex items-end justify-between gap-3">
        {contextUsage ? (
          <ChatContextUsageIndicator usage={contextUsage} />
        ) : (
          <span />
        )}
        <Button
          type="button"
          onClick={onSend}
          disabled={!message.trim() || isSending || isDisabled}
        >
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
