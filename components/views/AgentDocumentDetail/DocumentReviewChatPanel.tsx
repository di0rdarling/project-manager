"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { ChatContextUsageIndicator } from "@/components/views/Chats/ChatContextUsageIndicator";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import { ChatReasoningEffortSelect } from "@/components/views/Chats/ChatReasoningEffortSelect";
import {
  TeammateProfileAvatarLink,
  TeammateProfileLink,
} from "@/components/views/Chats/TeammateProfileLink";
import { useSendDocumentReviewMessage } from "@/hooks/mutations/agent-documents/useSendDocumentReviewMessage";
import { useAcceptAgentDocument } from "@/hooks/mutations/agent-documents/useAcceptAgentDocument";
import { useUpdateDocumentReviewChat } from "@/hooks/mutations/agent-documents/useUpdateDocumentReviewChat";
import { useFetchDocumentReviewChat } from "@/hooks/queries/useFetchDocumentReviewChat";
import {
  getChatModelLabel,
  normalizeChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import { getChatTeammate, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  chatModelSupportsReasoningEffort,
  DEFAULT_KIMI_REASONING_EFFORT,
  getKimiReasoningEffortLabel,
  normalizeKimiReasoningEffort,
  type KimiReasoningEffort,
} from "@/lib/chats/kimi-reasoning-effort";
import { formatDisplayDateTime } from "@/lib/dates";
import { shouldShowAssistantTypingIndicator } from "@/lib/chats/should-show-assistant-typing-indicator";
import { canAcceptAgentDocument } from "@/lib/agents/agent-documents";
import type {
  AgentDocumentReviewMessageResponse,
  AgentDocumentStatus,
} from "@/lib/types";

type DocumentReviewChatPanelProps = {
  teammateId: ChatTeammateId;
  documentId: string;
  projectId?: string | null;
  documentStatus?: AgentDocumentStatus;
};

function ReviewChatMessageBubble({
  message,
  teammateId,
  projectId,
}: {
  message: AgentDocumentReviewMessageResponse;
  teammateId: ChatTeammateId;
  projectId?: string | null;
}) {
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
        from="agents"
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

function AssistantTypingIndicator({
  teammateId,
  projectId,
}: {
  teammateId: ChatTeammateId;
  projectId?: string | null;
}) {
  const teammate = getChatTeammate(teammateId);

  return (
    <div className="flex items-start gap-2.5">
      <TeammateProfileAvatarLink
        teammate={teammate}
        size="sm"
        className="mt-1 shrink-0"
        from="agents"
        projectId={projectId}
      />
      <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Thinking...
      </div>
    </div>
  );
}

export function DocumentReviewChatPanel({
  teammateId,
  documentId,
  projectId = null,
  documentStatus: initialDocumentStatus,
}: Readonly<DocumentReviewChatPanelProps>) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const teammate = getChatTeammate(teammateId);

  const {
    data: reviewChat,
    isPending,
    isError,
    error,
  } = useFetchDocumentReviewChat(teammateId, documentId);

  const sendMessageMutation = useSendDocumentReviewMessage({
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const acceptDocumentMutation = useAcceptAgentDocument({
    onSuccess: () => {
      toast.success("Task marked complete.");
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const updateSettingsMutation = useUpdateDocumentReviewChat({
    onSuccess: (data, variables) => {
      if (variables.modelId !== undefined) {
        toast.success(`Model changed to ${getChatModelLabel(data.modelId)}.`);
        return;
      }

      if (
        variables.reasoningEffort !== undefined &&
        data.reasoningEffort
      ) {
        toast.success(
          `Reasoning effort changed to ${getKimiReasoningEffortLabel(data.reasoningEffort)}.`,
        );
      }
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const selectedModelId = normalizeChatModelId(reviewChat?.modelId);
  const selectedReasoningEffort = normalizeKimiReasoningEffort(
    reviewChat?.reasoningEffort ?? DEFAULT_KIMI_REASONING_EFFORT,
  );
  const showReasoningEffortSelect =
    chatModelSupportsReasoningEffort(selectedModelId);
  const isAtContextLimit = Boolean(reviewChat?.contextUsage?.isAtLimit);
  const modelSettingsDisabled =
    updateSettingsMutation.isPending || sendMessageMutation.isPending;
  const showAssistantTypingIndicator = shouldShowAssistantTypingIndicator(
    sendMessageMutation.isPending,
    reviewChat?.messages ?? [],
  );
  const documentStatus =
    reviewChat?.document.status ?? initialDocumentStatus ?? null;
  const canMarkComplete = documentStatus
    ? canAcceptAgentDocument(documentStatus)
    : false;
  const isMarkingComplete = acceptDocumentMutation.isPending;

  function handleMarkComplete() {
    if (!canMarkComplete || isMarkingComplete) {
      return;
    }

    acceptDocumentMutation.mutate({
      teammateId,
      documentId,
      projectId,
    });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reviewChat?.messages.length, sendMessageMutation.isPending]);

  function sendMessage() {
    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      isSendingRef.current ||
      sendMessageMutation.isPending ||
      isAtContextLimit
    ) {
      return;
    }

    isSendingRef.current = true;
    setMessage("");

    sendMessageMutation.mutate(
      {
        teammateId,
        documentId,
        content: trimmedMessage,
      },
      {
        onError: () => {
          setMessage(trimmedMessage);
        },
        onSettled: () => {
          isSendingRef.current = false;
        },
      },
    );
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
      updateSettingsMutation.isPending ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    updateSettingsMutation.mutate({
      teammateId,
      documentId,
      modelId,
    });
  }

  function handleReasoningEffortChange(reasoningEffort: KimiReasoningEffort) {
    if (
      reasoningEffort === selectedReasoningEffort ||
      updateSettingsMutation.isPending ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    updateSettingsMutation.mutate({
      teammateId,
      documentId,
      reasoningEffort,
    });
  }

  return (
    <aside className="flex min-h-[420px] w-full shrink-0 flex-col overflow-hidden border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 xl:min-h-0 xl:w-[min(100%,28rem)] xl:flex-none xl:border-l xl:border-t-0 2xl:w-[min(100%,32rem)]">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <TeammateProfileAvatarLink
            teammate={teammate}
            size="md"
            className="shrink-0"
            from="agents"
            projectId={projectId}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <TeammateProfileLink
                teammate={teammate}
                from="agents"
                projectId={projectId}
                className="transition hover:underline"
              >
                {teammate.name}
              </TeammateProfileLink>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Discuss this deliverable
            </p>
            {canMarkComplete ? (
              <Button
                type="button"
                onClick={handleMarkComplete}
                disabled={isMarkingComplete || isPending || isError}
                className="mt-3 w-full"
              >
                {isMarkingComplete ? "Marking complete..." : "Mark task complete"}
              </Button>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="w-36 min-w-0">
                <ChatModelSelect
                  id={`document-review-model-${documentId}`}
                  value={selectedModelId}
                  onChange={handleModelChange}
                  disabled={modelSettingsDisabled || isPending || isError}
                />
              </div>
              {showReasoningEffortSelect ? (
                <div className="w-24 min-w-0">
                  <ChatReasoningEffortSelect
                    id={`document-review-reasoning-${documentId}`}
                    value={selectedReasoningEffort}
                    onChange={handleReasoningEffortChange}
                    disabled={modelSettingsDisabled || isPending || isError}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isPending ? (
          <LoadingMessage>Loading conversation...</LoadingMessage>
        ) : isError ? (
          <ErrorMessage
            error={error}
            fallbackMessage="Failed to load review chat"
          />
        ) : (
          <>
            {isAtContextLimit ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                This conversation has reached its context limit.
              </div>
            ) : null}

            {reviewChat?.messages.length === 0 &&
            !sendMessageMutation.isPending ? (
              <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ask {teammate.name} about their approach, request
                  clarifications, or discuss changes before you sign off.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviewChat?.messages.map((chatMessage) => (
                  <ReviewChatMessageBubble
                    key={chatMessage._id}
                    message={chatMessage}
                    teammateId={teammateId}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}

            {showAssistantTypingIndicator ? (
              <AssistantTypingIndicator
                teammateId={teammateId}
                projectId={projectId}
              />
            ) : null}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {isAtContextLimit ? (
          <div className="flex items-center gap-3">
            {reviewChat?.contextUsage ? (
              <ChatContextUsageIndicator usage={reviewChat.contextUsage} />
            ) : null}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This conversation is read-only because it has reached the context
              limit.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${teammate.name}...`}
              rows={3}
              disabled={
                sendMessageMutation.isPending || isPending || isError
              }
              className="w-full resize-none rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-400"
            />
            <div className="flex items-end justify-between gap-3">
              {reviewChat?.contextUsage ? (
                <ChatContextUsageIndicator usage={reviewChat.contextUsage} />
              ) : (
                <span />
              )}
              <Button
                type="button"
                onClick={sendMessage}
                disabled={
                  !message.trim() ||
                  sendMessageMutation.isPending ||
                  isPending ||
                  isError
                }
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
