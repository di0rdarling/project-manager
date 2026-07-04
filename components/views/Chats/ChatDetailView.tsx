"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { useSendChatMessage } from "@/hooks/mutations/chats/useSendChatMessage";
import { useFetchChat } from "@/hooks/queries/useFetchChat";
import { getChatTeammate, type ChatTeammate } from "@/lib/chat-teammates";
import { formatDisplayDateTime } from "@/lib/dates";
import type { ChatMessageResponse } from "@/lib/types";

interface ChatDetailViewProps {
  chatId: string;
}

function TeammateAvatar({
  teammate,
  size = "sm",
  className,
}: {
  teammate: ChatTeammate;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Avatar
      initials={teammate.avatarInitials}
      src={teammate.avatarImageSrc}
      alt={teammate.name}
      colorClassName={teammate.avatarColorClassName}
      size={size}
      className={className}
    />
  );
}

function ChatMessageBubble({
  message,
  teammate,
}: {
  message: ChatMessageResponse;
  teammate: ChatTeammate;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          <MarkdownContent content={message.content} variant="inverted" />
          <time
            dateTime={message.createdAt}
            className="mt-2 block text-xs text-zinc-300 dark:text-zinc-600"
          >
            {formatDisplayDateTime(message.createdAt)}
          </time>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <TeammateAvatar teammate={teammate} className="mt-1" />
      <div className="max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <MarkdownContent content={message.content} variant="default" />
        <time
          dateTime={message.createdAt}
          className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400"
        >
          {formatDisplayDateTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function AssistantTypingIndicator({ teammate }: { teammate: ChatTeammate }) {
  return (
    <div className="flex items-start gap-3">
      <TeammateAvatar teammate={teammate} className="mt-1" />
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Thinking...
      </div>
    </div>
  );
}

export default function ChatDetailView({
  chatId,
}: Readonly<ChatDetailViewProps>) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: chat,
    isPending,
    isError,
    error,
  } = useFetchChat(chatId);

  const sendMessageMutation = useSendChatMessage({
    onSuccess: () => {
      setMessage("");
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length, sendMessageMutation.isPending]);

  function sendMessage() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sendMessageMutation.isPending) {
      return;
    }

    sendMessageMutation.mutate({
      chatId,
      content: trimmedMessage,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    sendMessage();
  }

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <LoadingMessage>Loading chat...</LoadingMessage>
      </div>
    );
  }

  if (isError || !chat) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Link
          href="/chats"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to chats
        </Link>
        <ErrorMessage error={error} fallbackMessage="Failed to load chat" />
      </div>
    );
  }

  const teammate = getChatTeammate(chat.teammateId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
          <Link
            href="/chats"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            Back
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <TeammateAvatar teammate={teammate} size="md" />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{chat.title}</h1>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {teammate.name} · {teammate.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full min-h-full max-w-3xl flex-col justify-end gap-4">
          {chat.messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Send a message to start the conversation.
              </p>
            </div>
          ) : (
            chat.messages.map((chatMessage) => (
              <ChatMessageBubble
                key={chatMessage._id}
                message={chatMessage}
                teammate={teammate}
              />
            ))
          )}

          {sendMessageMutation.isPending ? (
            <AssistantTypingIndicator teammate={teammate} />
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-end gap-3"
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={3}
            disabled={sendMessageMutation.isPending}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-400"
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="shrink-0"
          >
            {sendMessageMutation.isPending ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
