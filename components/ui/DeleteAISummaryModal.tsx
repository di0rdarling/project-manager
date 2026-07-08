"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type DeleteAISummaryModalProps = {
  open: boolean;
  description: string;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAISummaryModal({
  open,
  description,
  isPending,
  error,
  onClose,
  onConfirm,
}: Readonly<DeleteAISummaryModalProps>) {
  function handleClose() {
    if (isPending) {
      return;
    }

    onClose();
  }

  const formError = error instanceof Error ? error.message : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete summary">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? "Deleting..." : "Delete summary"}
        </Button>
      </div>
    </Modal>
  );
}
