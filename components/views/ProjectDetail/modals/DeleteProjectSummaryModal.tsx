"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteProjectSummary } from "@/hooks/mutations/projects/useDeleteProjectSummary";

type DeleteProjectSummaryModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteProjectSummaryModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: DeleteProjectSummaryModalProps) {
  const deleteSummaryMutation = useDeleteProjectSummary({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    deleteSummaryMutation.mutate(projectId);
  }

  function handleClose() {
    if (deleteSummaryMutation.isPending) {
      return;
    }

    deleteSummaryMutation.reset();
    onClose();
  }

  const formError =
    deleteSummaryMutation.error instanceof Error
      ? deleteSummaryMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete summary">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this AI-generated project summary? You
        can generate a new one at any time.
      </p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={deleteSummaryMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteSummaryMutation.isPending}
        >
          {deleteSummaryMutation.isPending ? "Deleting..." : "Delete summary"}
        </Button>
      </div>
    </Modal>
  );
}
