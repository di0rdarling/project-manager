"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/inputs/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/inputs/Textarea";
import { useUpdateProject } from "@/hooks/mutations/projects/useUpdateProject";
import type { ProjectResponse } from "@/lib/types";

type EditProjectModalProps = {
  open: boolean;
  project: ProjectResponse | null;
  onClose: () => void;
  onSuccess: (projectName: string) => void;
};

export default function EditProjectModal({
  open,
  project,
  onClose,
  onSuccess,
}: EditProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
    }
  }, [project]);

  const updateProjectMutation = useUpdateProject({
    onSuccess: (updatedProject) => {
      onSuccess(updatedProject.name);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    updateProjectMutation.mutate({
      projectId: project._id,
      name,
      description,
    });
  }

  function handleClose() {
    if (updateProjectMutation.isPending) {
      return;
    }

    updateProjectMutation.reset();
    onClose();
  }

  const formError =
    updateProjectMutation.error instanceof Error
      ? updateProjectMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Edit project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-name"
          label="Project name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My project"
          required
        />

        <Textarea
          id="edit-description"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this project about?"
          rows={3}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateProjectMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateProjectMutation.isPending}>
            {updateProjectMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
