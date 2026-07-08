"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteProject } from "@/hooks/mutations/projects/useDeleteProject";
import type { ProjectResponse } from "@/lib/types";

type DeleteProjectModalProps = {
  open: boolean;
  project: ProjectResponse | null;
  onClose: () => void;
  onSuccess: (projectName: string) => void;
};

export default function DeleteProjectModal({
  open,
  project,
  onClose,
  onSuccess,
}: DeleteProjectModalProps) {
  const deleteProjectMutation = useDeleteProject({
    onSuccess: () => {
      if (project) {
        onSuccess(project.name);
      }
      onClose();
    },
  });

  function handleDelete() {
    if (!project) {
      return;
    }

    deleteProjectMutation.mutate(project._id);
  }

  function handleClose() {
    if (deleteProjectMutation.isPending) {
      return;
    }

    deleteProjectMutation.reset();
    onClose();
  }

  const formError =
    deleteProjectMutation.error instanceof Error
      ? deleteProjectMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete project" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {project?.name}
        </span>
        ? This action cannot be undone.
      </p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={deleteProjectMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteProjectMutation.isPending}
        >
          {deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
        </Button>
      </div>
    </Modal>
  );
}
