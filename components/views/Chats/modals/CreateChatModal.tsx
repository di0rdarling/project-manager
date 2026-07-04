"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { AvatarSelect } from "@/components/ui/inputs/AvatarSelect";
import { Select } from "@/components/ui/inputs/Select";
import { Modal } from "@/components/ui/Modal";
import { useCreateChat } from "@/hooks/mutations/chats/useCreateChat";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";
import {
  CHAT_TEAMMATES,
  DEFAULT_CHAT_TEAMMATE_ID,
  type ChatTeammateId,
} from "@/lib/chat-teammates";

const TEAMMATE_OPTIONS = CHAT_TEAMMATES.map((teammate) => ({
  value: teammate.id,
  label: teammate.name,
  description: teammate.role,
  avatar: (
    <Avatar
      initials={teammate.avatarInitials}
      src={teammate.avatarImageSrc}
      alt={teammate.name}
      colorClassName={teammate.avatarColorClassName}
    />
  ),
}));

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
  const [selectedTeammateId, setSelectedTeammateId] = useState<ChatTeammateId>(
    DEFAULT_CHAT_TEAMMATE_ID,
  );

  const {
    data: projects = [],
    isPending: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useFetchProjects({ enabled: open });

  const createChatMutation = useCreateChat({
    onSuccess: (chat) => {
      setSelectedProjectId("");
      setSelectedTeammateId(DEFAULT_CHAT_TEAMMATE_ID);
      onSuccess(chat._id);
      onClose();
    },
  });

  const effectiveProjectId =
    selectedProjectId && projects.some((project) => project._id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?._id ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!effectiveProjectId) {
      return;
    }

    createChatMutation.mutate({
      projectId: effectiveProjectId,
      teammateId: selectedTeammateId,
    });
  }

  function handleClose() {
    if (createChatMutation.isPending) {
      return;
    }

    setSelectedProjectId("");
    setSelectedTeammateId(DEFAULT_CHAT_TEAMMATE_ID);
    createChatMutation.reset();
    onClose();
  }

  const formError =
    createChatMutation.error instanceof Error
      ? createChatMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Start a new chat">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose a project to discuss and who you&apos;d like to talk to. The
          AI will use that project&apos;s details as context for the
          conversation.
        </p>

        <AvatarSelect
          id="teammateId"
          label="AI Teammate"
          value={selectedTeammateId}
          onChange={(value) => setSelectedTeammateId(value as ChatTeammateId)}
          options={TEAMMATE_OPTIONS}
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
              href="/"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              onClick={handleClose}
            >
              Go to Project Manager
            </Link>
          </div>
        ) : (
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
              !effectiveProjectId
            }
          >
            {createChatMutation.isPending ? "Starting..." : "Start chat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
