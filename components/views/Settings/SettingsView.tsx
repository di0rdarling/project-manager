"use client";

import { useEffect, useState } from "react";
import PageContent from "@/components/layout/PageContent";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useUpdateCurrentUser } from "@/hooks/mutations/auth/useUpdateCurrentUser";
import { useFetchCurrentUser } from "@/hooks/queries/useFetchCurrentUser";
import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/lib/chats/chat-models";

type SettingsRowProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200 px-4 py-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
      <div className="space-y-1 sm:max-w-md">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <div className="w-full sm:max-w-xs">{children}</div>
    </div>
  );
}

export default function SettingsView() {
  const {
    data: currentUser,
    isPending,
    isError,
    error,
  } = useFetchCurrentUser();
  const [selectedModelId, setSelectedModelId] = useState<ChatModelId>(
    DEFAULT_CHAT_MODEL_ID,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const savedModelId =
    currentUser?.agentTaskGenerationModelId ?? DEFAULT_CHAT_MODEL_ID;

  useEffect(() => {
    setSelectedModelId(savedModelId);
    setSaveError(null);
  }, [savedModelId]);

  const updateCurrentUserMutation = useUpdateCurrentUser({
    onError: (mutationError) => {
      setSaveError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save settings",
      );
      setSelectedModelId(savedModelId);
    },
    onSuccess: () => {
      setSaveError(null);
    },
  });

  function handleModelChange(modelId: ChatModelId) {
    setSelectedModelId(modelId);
    setSaveError(null);
    updateCurrentUserMutation.mutate({ agentTaskGenerationModelId: modelId });
  }

  return (
    <PageContent>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Configure AI preferences for your workspace.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">AI preferences</h2>

        {isPending ? (
          <LoadingMessage>Loading settings...</LoadingMessage>
        ) : null}

        {isError ? (
          <ErrorMessage
            error={error}
            fallbackMessage="Unable to load settings"
          />
        ) : null}

        {currentUser ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <SettingsRow
              title="Agent task generation model"
              description="Choose which model generates suggested tasks for your agents. This applies whenever you generate new task suggestions."
            >
              <ChatModelSelect
                id="agent-task-generation-model"
                value={selectedModelId}
                onChange={handleModelChange}
                disabled={updateCurrentUserMutation.isPending}
                showLabel
                compact={false}
              />
            </SettingsRow>
          </div>
        ) : null}

        {saveError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}
      </section>
    </PageContent>
  );
}
