"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
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
import { useSendAgentTaskOverviewMessage } from "@/hooks/mutations/chats/useSendAgentTaskOverviewMessage";
import { useUpdateAgentTaskOverviewChat } from "@/hooks/mutations/chats/useUpdateAgentTaskOverviewChat";
import { useFetchAgentTaskOverviewChat } from "@/hooks/queries/useFetchAgentTaskOverviewChat";
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
import type { AgentTask } from "@/lib/types";

type AgentTaskOverviewChatPanelProps = {
  teammateId: ChatTeammateId;
  projectId: string;
  taskTitle: string;
  compact?: boolean;
  onClose?: () => void;
  onTaskUpdated?: (task: AgentTask) => void;
};

export function AgentTaskOverviewChatPanel({
  teammateId,
  projectId,
  taskTitle,
  compact = false,
  onClose,
  onTaskUpdated,
}: Readonly<AgentTaskOverviewChatPanelProps>) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const teammate = getChatTeammate(teammateId);

  const {
    data: overviewChat,
    isPending,
    isError,
    error,
  } = useFetchAgentTaskOverviewChat(teammateId, projectId, taskTitle, {
    enabled: Boolean(projectId && taskTitle),
  });

  const sendMessageMutation = useSendAgentTaskOverviewMessage({
    onSuccess: (data) => {
      onTaskUpdated?.(data.task);
    },
    onError: (mutationError) => {
      toast.error(mutationError.message);
    },
  });

  const updateSettingsMutation = useUpdateAgentTaskOverviewChat({
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

  const selectedModelId = normalizeChatModelId(overviewChat?.modelId);
  const selectedReasoningEffort = normalizeKimiReasoningEffort(
    overviewChat?.reasoningEffort ?? DEFAULT_KIMI_REASONING_EFFORT,
  );
  const showReasoningEffortSelect =
    chatModelSupportsReasoningEffort(selectedModelId);
  const isAtContextLimit = Boolean(overviewChat?.contextUsage?.isAtLimit);
  const modelSettingsDisabled =
    updateSettingsMutation.isPending || sendMessageMutation.isPending;
  const showAssistantTypingIndicator = shouldShowAssistantTypingIndicator(
    sendMessageMutation.isPending,
    overviewChat?.messages ?? [],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [overviewChat?.messages.length, sendMessageMutation.isPending]);

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
        projectId,
        taskTitle,
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
      projectId,
      taskTitle,
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
      projectId,
      taskTitle,
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
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
              Discuss this task
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              Close
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="w-36 min-w-0">
            <ChatModelSelect
              id={`task-overview-model-${taskTitle}`}
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={modelSettingsDisabled || isPending || isError}
            />
          </div>
          {showReasoningEffortSelect ? (
            <div className="w-24 min-w-0">
              <ChatReasoningEffortSelect
                id={`task-overview-reasoning-${taskTitle}`}
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
      fallbackMessage="Failed to load task conversation"
    />
  ) : (
    <>
      {isAtContextLimit ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          This conversation has reached its context limit.
        </div>
      ) : null}

      {overviewChat?.messages.length === 0 &&
      !sendMessageMutation.isPending ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ask {teammate.name} about this task, discuss scope and impact, or
            explore alternatives before you accept or reject it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {overviewChat?.messages.map((chatMessage) => (
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
      contextUsage={overviewChat?.contextUsage}
      isAtContextLimit={isAtContextLimit}
    />
  );

  return (
    <AgentSideChatPanelAside
      header={header}
      footer={footer}
      compact={compact}
    >
      {messagesContent}
    </AgentSideChatPanelAside>
  );
}
