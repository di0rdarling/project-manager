"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { AvatarSelect } from "@/components/ui/inputs/AvatarSelect";
import { Select } from "@/components/ui/inputs/Select";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import { Modal } from "@/components/ui/Modal";
import { useCreateChat } from "@/hooks/mutations/chats/useCreateChat";
import { useFetchFeatures } from "@/hooks/queries/useFetchFeatures";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";
import { useFetchRequirements } from "@/hooks/queries/useFetchRequirements";
import { CHAT_TEAMMATE_SELECT_OPTIONS } from "@/lib/chat-teammate-options";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import { DEFAULT_CHAT_MODEL_ID, type ChatModelId } from "@/lib/chat-models";

type CreateChatModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (chatId: string) => void;
};

export default function CreateChatModal({
  open,
  onClose,
  onSuccess,
}: CreateChatModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [selectedTeammateId, setSelectedTeammateId] = useState<ChatTeammateId>(
    DEFAULT_CHAT_TEAMMATE_ID,
  );
  const [selectedModelId, setSelectedModelId] =
    useState<ChatModelId>(DEFAULT_CHAT_MODEL_ID);

  const {
    data: projects = [],
    isPending: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useFetchProjects({ enabled: open });

  const effectiveProjectId =
    selectedProjectId && projects.some((project) => project._id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?._id ?? "");

  const {
    data: requirements = [],
    isPending: isLoadingRequirements,
    isError: isRequirementsError,
    error: requirementsError,
  } = useFetchRequirements(effectiveProjectId, {
    enabled: open && Boolean(effectiveProjectId),
  });

  const {
    data: features = [],
    isPending: isLoadingFeatures,
    isError: isFeaturesError,
    error: featuresError,
  } = useFetchFeatures(effectiveProjectId, {
    enabled: open && Boolean(effectiveProjectId),
  });

  useEffect(() => {
    setSelectedRequirementId("");
    setSelectedFeatureId("");
  }, [effectiveProjectId]);

  const createChatMutation = useCreateChat({
    onSuccess: (chat) => {
      setSelectedProjectId("");
      setSelectedRequirementId("");
      setSelectedFeatureId("");
      setSelectedTeammateId(DEFAULT_CHAT_TEAMMATE_ID);
      setSelectedModelId(DEFAULT_CHAT_MODEL_ID);
      onSuccess(chat._id);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!effectiveProjectId) {
      return;
    }

    createChatMutation.mutate({
      projectId: effectiveProjectId,
      teammateId: selectedTeammateId,
      requirementId: selectedRequirementId || null,
      featureId: selectedFeatureId || null,
      modelId: selectedModelId,
    });
  }

  function handleClose() {
    if (createChatMutation.isPending) {
      return;
    }

    setSelectedProjectId("");
    setSelectedRequirementId("");
    setSelectedFeatureId("");
    setSelectedTeammateId(DEFAULT_CHAT_TEAMMATE_ID);
    setSelectedModelId(DEFAULT_CHAT_MODEL_ID);
    createChatMutation.reset();
    onClose();
  }

  const formError =
    createChatMutation.error instanceof Error
      ? createChatMutation.error.message
      : null;

  const isLoadingProjectDetails =
    Boolean(effectiveProjectId) &&
    (isLoadingRequirements || isLoadingFeatures);
  const hasProjectDetailsError =
    Boolean(effectiveProjectId) &&
    (isRequirementsError || isFeaturesError);

  return (
    <Modal open={open} onClose={handleClose} title="Start a new chat">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose a project to discuss and who you&apos;d like to talk to. You
          can optionally narrow the conversation to a specific requirement or
          feature.
        </p>

        <AvatarSelect
          id="teammateId"
          label="AI Teammate"
          value={selectedTeammateId}
          onChange={(value) => setSelectedTeammateId(value as ChatTeammateId)}
          options={CHAT_TEAMMATE_SELECT_OPTIONS}
        />

        <ChatModelSelect
          id="create-chat-model"
          value={selectedModelId}
          onChange={setSelectedModelId}
          showLabel
        />

        {isLoadingProjects ? (
          <LoadingMessage>Loading projects...</LoadingMessage>
        ) : isProjectsError ? (
          <ErrorMessage
            error={projectsError}
            fallbackMessage="Failed to load projects"
          />
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You need at least one project before starting a chat.
            </p>
            <Link
              href="/home"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              onClick={handleClose}
            >
              Go to Project Manager
            </Link>
          </div>
        ) : (
          <>
            <Select
              id="projectId"
              label="Project"
              value={effectiveProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              options={projects.map((project) => ({
                value: project._id,
                label: project.name,
              }))}
              required
            />

            {isLoadingProjectDetails ? (
              <LoadingMessage>Loading project details...</LoadingMessage>
            ) : hasProjectDetailsError ? (
              <ErrorMessage
                error={requirementsError ?? featuresError}
                fallbackMessage="Failed to load project requirements and features"
              />
            ) : requirements.length > 0 ? (
              <Select
                id="requirementId"
                label="Requirement (optional)"
                value={selectedRequirementId}
                onChange={(event) =>
                  setSelectedRequirementId(event.target.value)
                }
                options={[
                  { value: "", label: "No specific requirement" },
                  ...requirements.map((requirement) => ({
                    value: requirement._id,
                    label:
                      requirement.title.trim() || "Untitled requirement",
                  })),
                ]}
              />
            ) : null}

            {features.length > 0 ? (
              <Select
                id="featureId"
                label="Feature (optional)"
                value={selectedFeatureId}
                onChange={(event) => setSelectedFeatureId(event.target.value)}
                options={[
                  { value: "", label: "No specific feature" },
                  ...features.map((feature) => ({
                    value: feature._id,
                    label: feature.title.trim() || "Untitled feature",
                  })),
                ]}
              />
            ) : null}
          </>
        )}

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createChatMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createChatMutation.isPending ||
              isLoadingProjects ||
              isProjectsError ||
              projects.length === 0 ||
              !effectiveProjectId ||
              isLoadingProjectDetails ||
              hasProjectDetailsError
            }
          >
            {createChatMutation.isPending ? "Starting..." : "Start chat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
