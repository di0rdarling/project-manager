"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteRequirement } from "@/hooks/mutations/requirements/useDeleteRequirement";
import type { RequirementResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteRequirementModalProps = {
  open: boolean;
  projectId: string;
  requirement: RequirementResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteRequirementModal({
  open,
  projectId,
  requirement,
  onClose,
  onSuccess,
}: DeleteRequirementModalProps) {
  const deleteRequirementMutation = useDeleteRequirement({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!requirement) {
      return;
    }

    deleteRequirementMutation.mutate({
      projectId,
      requirementId: requirement._id,
    });
  }

  function handleClose() {
    if (deleteRequirementMutation.isPending) {
      return;
    }

    deleteRequirementMutation.reset();
    onClose();
  }

  const formError =
    deleteRequirementMutation.error instanceof Error
      ? deleteRequirementMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete requirement" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this requirement
        {requirement ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {requirement.title.trim() ||
                getRichTextPreview(requirement.content)}
              &rdquo;
            </span>
          </>
        ) : null}
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
          disabled={deleteRequirementMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteRequirementMutation.isPending}
        >
          {deleteRequirementMutation.isPending
            ? "Deleting..."
            : "Delete requirement"}
        </Button>
      </div>
    </Modal>
  );
}
