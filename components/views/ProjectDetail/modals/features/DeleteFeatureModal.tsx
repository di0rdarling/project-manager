"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteFeature } from "@/hooks/mutations/features/useDeleteFeature";
import type { FeatureResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteFeatureModalProps = {
  open: boolean;
  projectId: string;
  feature: FeatureResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteFeatureModal({
  open,
  projectId,
  feature,
  onClose,
  onSuccess,
}: DeleteFeatureModalProps) {
  const deleteFeatureMutation = useDeleteFeature({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!feature) {
      return;
    }

    deleteFeatureMutation.mutate({
      projectId,
      featureId: feature._id,
    });
  }

  function handleClose() {
    if (deleteFeatureMutation.isPending) {
      return;
    }

    deleteFeatureMutation.reset();
    onClose();
  }

  const formError =
    deleteFeatureMutation.error instanceof Error
      ? deleteFeatureMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete feature">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this feature
        {feature ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {feature.title.trim() || getRichTextPreview(feature.content)}
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
          disabled={deleteFeatureMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteFeatureMutation.isPending}
        >
          {deleteFeatureMutation.isPending ? "Deleting..." : "Delete feature"}
        </Button>
      </div>
    </Modal>
  );
}
