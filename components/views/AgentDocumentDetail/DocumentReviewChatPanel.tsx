"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import { ChatReasoningEffortSelect } from "@/components/views/Chats/ChatReasoningEffortSelect";
import {
  TeammateProfileAvatarLink,
  TeammateProfileLink,
} from "@/components/views/Chats/TeammateProfileLink";
import { AgentChatComposer } from "@/components/views/shared/AgentChatComposer";
import {
  AgentChatMessageBubble,
  AgentChatTypingIndicator,
} from "@/components/views/shared/AgentChatMessageBubble";
import { AgentSideChatPanelAside } from "@/components/views/shared/AgentSideChatPanelAside";
import { useSendDocumentReviewMessage } from "@/hooks/mutations/agent-documents/useSendDocumentReviewMessage";
import { useAgentChatAutoScroll } from "@/hooks/useAgentChatAutoScroll";
import { useAcceptAgentDocument } from "@/hooks/mutations/agent-documents/useAcceptAgentDocument";
import { useRejectAgentDocument } from "@/hooks/mutations/agent-documents/useRejectAgentDocument";
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
import { shouldShowAssistantTypingIndicator } from "@/lib/chats/should-show-assistant-typing-indicator";
import { getVisibleChatMessages } from "@/lib/chats/streaming-chat-mutation-helpers";
import { canAcceptAgentDocument, canRejectAgentDocument } from "@/lib/agents/agent-documents";
import { REJECT_AGENT_TASK_CONFIRMATION } from "@/lib/agents/agent-task-reject-copy";
import type { AgentDocumentStatus } from "@/lib/types";

type DocumentReviewChatPanelProps = {
  teammateId: ChatTeammateId;
  documentId: string;
  projectId?: string | null;
  documentStatus?: AgentDocumentStatus;
  onTaskRejected?: () => void;
  /** Hide accept/reject actions while the user is hand-editing the document. */
  disableReviewActions?: boolean;
};

export function DocumentReviewChatPanel({
  teammateId,
  documentId,
  projectId = null,
  documentStatus: initialDocumentStatus,
  onTaskRejected,
  disableReviewActions = false,
}: Readonly<DocumentReviewChatPanelProps>) {
  const [message, setMessage] = useState("");
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
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

  const rejectDocumentMutation = useRejectAgentDocument({
    onSuccess: () => {
      toast.success("Task rejected.");
      setIsRejectConfirmOpen(false);
      onTaskRejected?.();
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
  const canMarkComplete =
    !disableReviewActions && documentStatus
      ? canAcceptAgentDocument(documentStatus)
      : false;
  const canReject =
    !disableReviewActions && documentStatus
      ? canRejectAgentDocument(documentStatus)
      : false;
  const isMarkingComplete = acceptDocumentMutation.isPending;
  const isRejecting = rejectDocumentMutation.isPending;
  const reviewActionDisabled =
    isMarkingComplete || isRejecting || isPending || isError;

  function handleMarkComplete() {
    if (!canMarkComplete || reviewActionDisabled) {
      return;
    }

    acceptDocumentMutation.mutate({
      teammateId,
      documentId,
      projectId,
    });
  }

  function handleReject() {
    if (!canReject || reviewActionDisabled) {
      return;
    }

    rejectDocumentMutation.mutate({
      teammateId,
      documentId,
      projectId,
    });
  }

  useAgentChatAutoScroll(
    reviewChat?.messages ?? [],
    sendMessageMutation.isPending,
    messagesEndRef,
  );

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

  const header = (
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
        {canMarkComplete || canReject ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {canReject ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRejectConfirmOpen(true)}
                disabled={reviewActionDisabled}
                className="w-full sm:flex-1"
              >
                Reject task
              </Button>
            ) : null}
            {canMarkComplete ? (
              <Button
                type="button"
                onClick={handleMarkComplete}
                disabled={reviewActionDisabled}
                className="w-full sm:flex-1"
              >
                {isMarkingComplete ? "Marking complete..." : "Mark task complete"}
              </Button>
            ) : null}
          </div>
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
  );

  const messagesContent = isPending ? (
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
          {getVisibleChatMessages(reviewChat?.messages ?? []).map((chatMessage) => (
            <AgentChatMessageBubble
              key={chatMessage._id}
              message={chatMessage}
              teammateId={teammateId}
              projectId={projectId}
            />
          ))}
        </div>
      )}

      {showAssistantTypingIndicator ? (
        <AgentChatTypingIndicator
          teammateId={teammateId}
          projectId={projectId}
        />
      ) : null}

      <div ref={messagesEndRef} />
    </>
  );

  const footer = (
    <AgentChatComposer
      teammateName={teammate.name}
      message={message}
      onMessageChange={setMessage}
      onSend={sendMessage}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      isSending={sendMessageMutation.isPending}
      isDisabled={isPending || isError}
      contextUsage={reviewChat?.contextUsage}
      isAtContextLimit={isAtContextLimit}
    />
  );

  return (
    <>
      <AgentSideChatPanelAside header={header} footer={footer}>
        {messagesContent}
      </AgentSideChatPanelAside>

      <DeleteAISummaryModal
        open={isRejectConfirmOpen}
        title="Reject this task?"
        description={REJECT_AGENT_TASK_CONFIRMATION}
        confirmLabel="Reject task"
        pendingLabel="Rejecting..."
        isPending={isRejecting}
        error={rejectDocumentMutation.error}
        onClose={() => {
          if (!isRejecting) {
            setIsRejectConfirmOpen(false);
          }
        }}
        onConfirm={handleReject}
      />
    </>
  );
}
