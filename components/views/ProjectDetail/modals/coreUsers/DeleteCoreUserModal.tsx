"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteCoreUser } from "@/hooks/mutations/useDeleteCoreUser";
import type { CoreUserResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteCoreUserModalProps = {
  open: boolean;
  projectId: string;
  coreUser: CoreUserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteCoreUserModal({
  open,
  projectId,
  coreUser,
  onClose,
  onSuccess,
}: DeleteCoreUserModalProps) {
  const deleteCoreUserMutation = useDeleteCoreUser({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!coreUser) {
      return;
    }

    deleteCoreUserMutation.mutate({
      projectId,
      coreUserId: coreUser._id,
    });
  }

  function handleClose() {
    if (deleteCoreUserMutation.isPending) {
      return;
    }

    deleteCoreUserMutation.reset();
    onClose();
  }

  const formError =
    deleteCoreUserMutation.error instanceof Error
      ? deleteCoreUserMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete core user">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this core user
        {coreUser ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {coreUser.name.trim() || getRichTextPreview(coreUser.content)}
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
          disabled={deleteCoreUserMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteCoreUserMutation.isPending}
        >
          {deleteCoreUserMutation.isPending ? "Deleting..." : "Delete core user"}
        </Button>
      </div>
    </Modal>
  );
}
