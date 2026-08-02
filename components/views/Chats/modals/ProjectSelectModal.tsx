"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/inputs/Select";
import { useFetchProjects } from "@/hooks/queries/useFetchProjects";

type ProjectSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  title?: string;
};

export default function ProjectSelectModal({
  open,
  onClose,
  onSelect,
  title = "Select a project",
}: Readonly<ProjectSelectModalProps>) {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const {
    data: projects = [],
    isPending,
    isError,
    error,
  } = useFetchProjects({ enabled: open });

  function handleClose() {
    setSelectedProjectId("");
    onClose();
  }

  function handleConfirm() {
    if (selectedProjectId) {
      onSelect(selectedProjectId);
      setSelectedProjectId("");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="narrow"
      primaryAction={{
        label: "Continue",
        onClick: handleConfirm,
        disabled: !selectedProjectId,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
        variant: "secondary",
      }}
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose which project you&apos;d like to start this chat in.
        </p>

        {isPending ? (
          <LoadingMessage>Loading projects...</LoadingMessage>
        ) : isError ? (
          <ErrorMessage error={error} fallbackMessage="Failed to load projects" />
        ) : projects.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No projects yet. Create a project first to start a chat.
          </p>
        ) : (
          <Select
            id="project-select"
            label="Project"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            options={[
              { value: "", label: "Select a project", disabled: true },
              ...projects.map((project) => ({
                value: project._id,
                label: project.name,
              })),
            ]}
          />
        )}
      </div>
    </Modal>
  );
}
