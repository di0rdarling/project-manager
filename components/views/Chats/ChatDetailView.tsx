"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import PageContent, { pageInnerClassName } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/Button";
import { ContextTag } from "@/components/ui/ContextTag";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import EditChatTitleModal from "@/components/views/Chats/modals/EditChatTitleModal";
import { ChatContextUsageIndicator } from "@/components/views/Chats/ChatContextUsageIndicator";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import ChatMessageGrounding from "@/components/views/Chats/ChatMessageGrounding";
import ChatSummaryModal from "@/components/views/Chats/modals/ChatSummaryModal";
import {
  TeammateProfileAvatarLink,
  TeammateProfileLink,
} from "@/components/views/Chats/TeammateProfileLink";
import { useSendChatMessage } from "@/hooks/mutations/chats/useSendChatMessage";
import { useUnarchiveChat } from "@/hooks/mutations/chats/useUnarchiveChat";
import { useUpdateChat } from "@/hooks/mutations/chats/useUpdateChat";
import { useFetchChat } from "@/hooks/queries/useFetchChat";
import {
  getChatModelLabel,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chat-models";
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
    <TeammateProfileAvatarLink
      teammate={teammate}
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
          <div className="mt-2 flex items-center justify-end gap-1">
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
    <div className="flex items-start gap-3">
      <TeammateAvatar teammate={teammate} className="mt-1" />
      <div className="max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <MarkdownContent content={message.content} variant="default" />
        <ChatMessageGrounding message={message} />
        <div className="mt-2 flex items-center justify-between gap-2">
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

function ChatContextChips({
  project,
  requirement,
  feature,
}: {
  project: { _id: string; name: string } | null;
  requirement: { _id: string; title: string } | null;
  feature: { _id: string; title: string } | null;
}) {
  if (!project && !requirement && !feature) {
    return null;
  }

  const chipClassName =
    "max-w-28 shrink sm:max-w-40 md:max-w-52";
  const projectChipClassName = `${chipClassName} bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100`;
  const contextChipClassName = `${chipClassName} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {project ? (
        <span title={project.name}>
          <ContextTag className={projectChipClassName}>{project.name}</ContextTag>
        </span>
      ) : null}
      {requirement ? (
        <span title={requirement.title}>
          <ContextTag className={contextChipClassName}>
            {requirement.title}
          </ContextTag>
        </span>
      ) : null}
      {feature ? (
        <span title={feature.title}>
          <ContextTag className={contextChipClassName}>{feature.title}</ContextTag>
        </span>
      ) : null}
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false);
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

  const unarchiveChatMutation = useUnarchiveChat({
    onSuccess: (unarchivedChat) => {
      toast.success(`Chat "${unarchivedChat.title}" restored to active chats.`);
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const updateChatModelMutation = useUpdateChat({
    onSuccess: (updatedChat) => {
      toast.success(`Model changed to ${getChatModelLabel(updatedChat.modelId)}.`);
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const isArchived = Boolean(chat?.archivedAt);
  const isAtContextLimit = Boolean(chat?.contextUsage?.isAtLimit);
  const selectedModelId = normalizeChatModelId(chat?.modelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length, sendMessageMutation.isPending]);

  function sendMessage() {
    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      sendMessageMutation.isPending ||
      isArchived ||
      isAtContextLimit
    ) {
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

  function handleModelChange(modelId: ChatModelId) {
    if (
      modelId === selectedModelId ||
      updateChatModelMutation.isPending ||
      isArchived
    ) {
      return;
    }

    updateChatModelMutation.mutate({
      chatId,
      modelId,
    });
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
      <PageContent className="gap-6">
        <Link
          href="/chats"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to chats
        </Link>
        <ErrorMessage error={error} fallbackMessage="Failed to load chat" />
      </PageContent>
    );
  }

  const teammate = getChatTeammate(chat.teammateId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className={`flex items-center gap-3 sm:gap-4 ${pageInnerClassName}`}>
          <Link
            href="/chats"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <TeammateAvatar teammate={teammate} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {chat.title}
                </h1>
                <IconButton
                  type="button"
                  aria-label="Edit chat title"
                  onClick={() => setIsEditTitleModalOpen(true)}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                <TeammateProfileLink
                  teammate={teammate}
                  className="font-medium text-zinc-700 transition hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {teammate.name}
                </TeammateProfileLink>
                {" · "}
                {teammate.role}
              </p>
            </div>
          </div>
          <ChatContextChips
            project={chat.project}
            requirement={chat.requirement}
            feature={chat.feature}
          />
          <div className="w-28 shrink-0 sm:w-36 md:w-44">
            <ChatModelSelect
              id="chat-model"
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={
                isArchived ||
                updateChatModelMutation.isPending ||
                sendMessageMutation.isPending
              }
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isArchived ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => unarchiveChatMutation.mutate(chatId)}
                disabled={unarchiveChatMutation.isPending}
              >
                {unarchiveChatMutation.isPending ? "Restoring..." : "Unarchive"}
              </Button>
            ) : null}
            {chat.conversationSummary ? (
              <IconButton
                type="button"
                aria-label="View conversation summary"
                title="View conversation summary"
                onClick={() => setIsSummaryModalOpen(true)}
              >
                <DocumentTextIcon className="size-5" />
              </IconButton>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className={`flex min-h-full flex-col justify-end gap-4 ${pageInnerClassName}`}>
          {isAtContextLimit ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              This conversation has reached its context limit. Start a new chat
              to continue.
            </div>
          ) : null}

          {isArchived ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              This chat is archived. Its summary has been compressed for your AI
              teammate&apos;s long-term memory. Unarchive to continue the
              conversation.
            </div>
          ) : null}

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
        {isArchived ? (
          <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${pageInnerClassName}`}>
            Archived chats are read-only. Unarchive this chat to send new messages.
          </p>
        ) : isAtContextLimit ? (
          <div className={`flex items-center gap-3 ${pageInnerClassName}`}>
            {chat.contextUsage ? (
              <ChatContextUsageIndicator usage={chat.contextUsage} />
            ) : null}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This conversation is read-only because it has reached the context
              limit. Start a new chat to continue.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`flex items-end gap-3 ${pageInnerClassName}`}
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
            <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
              {chat.contextUsage ? (
                <ChatContextUsageIndicator usage={chat.contextUsage} />
              ) : null}
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <EditChatTitleModal
        open={isEditTitleModalOpen}
        chat={chat}
        onClose={() => setIsEditTitleModalOpen(false)}
        onSuccess={(chatTitle) =>
          toast.success(`Chat title updated to "${chatTitle}".`)
        }
      />

      <ChatSummaryModal
        open={isSummaryModalOpen}
        summary={chat.conversationSummary}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </div>
  );
}
