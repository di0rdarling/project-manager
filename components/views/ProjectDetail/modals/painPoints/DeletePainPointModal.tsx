"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeletePainPoint } from "@/hooks/mutations/painPoints/useDeletePainPoint";
import type { PainPointResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeletePainPointModalProps = {
  open: boolean;
  projectId: string;
  painPoint: PainPointResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeletePainPointModal({
  open,
  projectId,
  painPoint,
  onClose,
  onSuccess,
}: DeletePainPointModalProps) {
  const deletePainPointMutation = useDeletePainPoint({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!painPoint) {
      return;
    }

    deletePainPointMutation.mutate({
      projectId,
      painPointId: painPoint._id,
    });
  }

  function handleClose() {
    if (deletePainPointMutation.isPending) {
      return;
    }

    deletePainPointMutation.reset();
    onClose();
  }

  const formError =
    deletePainPointMutation.error instanceof Error
      ? deletePainPointMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete pain point">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this pain point
        {painPoint ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {painPoint.title.trim() || getRichTextPreview(painPoint.content)}
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
          disabled={deletePainPointMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deletePainPointMutation.isPending}
        >
          {deletePainPointMutation.isPending ? "Deleting..." : "Delete pain point"}
        </Button>
      </div>
    </Modal>
  );
}
