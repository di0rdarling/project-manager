"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/inputs/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/inputs/Textarea";
import { useCreateProject } from "@/hooks/mutations/projects/useCreateProject";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (projectName: string) => void;
};

export default function CreateProjectModal({
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createProjectMutation = useCreateProject({
    onSuccess: (project) => {
      setName("");
      setDescription("");
      onSuccess(project.name);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProjectMutation.mutate({ name, description });
  }

  function handleClose() {
    if (createProjectMutation.isPending) {
      return;
    }

    setName("");
    setDescription("");
    createProjectMutation.reset();
    onClose();
  }

  const formError =
    createProjectMutation.error instanceof Error
      ? createProjectMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="New Project" size="narrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Project name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My new project"
          required
        />

        <Textarea
          id="description"
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
            disabled={createProjectMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createProjectMutation.isPending}>
            {createProjectMutation.isPending ? "Creating..." : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
