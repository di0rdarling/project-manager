"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { Select } from "@/components/ui/inputs/Select";
import { Modal } from "@/components/ui/Modal";
import { useCreateChat } from "@/hooks/mutations/chats/useCreateChat";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";

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

  const {
    data: projects = [],
    isPending: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useFetchProjects({ enabled: open });

  const createChatMutation = useCreateChat({
    onSuccess: (chat) => {
      setSelectedProjectId("");
      onSuccess(chat._id);
      onClose();
    },
  });

  useEffect(() => {
    if (!open || projects.length === 0) {
      return;
    }

    setSelectedProjectId((current) =>
      current && projects.some((project) => project._id === current)
        ? current
        : projects[0]._id,
    );
  }, [open, projects]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    createChatMutation.mutate({ projectId: selectedProjectId });
  }

  function handleClose() {
    if (createChatMutation.isPending) {
      return;
    }

    setSelectedProjectId("");
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
          Choose a project to discuss. The AI assistant will use that
          project&apos;s details as context for the conversation.
        </p>

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
            value={selectedProjectId}
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
              !selectedProjectId
            }
          >
            {createChatMutation.isPending ? "Starting..." : "Start chat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
