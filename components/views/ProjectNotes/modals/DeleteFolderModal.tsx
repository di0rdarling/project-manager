"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteNoteFolder } from "@/hooks/mutations/noteFolders/useDeleteNoteFolder";
import type { NoteFolderResponse } from "@/lib/types";

type DeleteFolderModalProps = {
  open: boolean;
  projectId: string;
  folder: NoteFolderResponse | null;
  childFolderCount: number;
  noteCount: number;
  parentFolderName: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteFolderModal({
  open,
  projectId,
  folder,
  childFolderCount,
  noteCount,
  parentFolderName,
  onClose,
  onSuccess,
}: Readonly<DeleteFolderModalProps>) {
  const deleteFolderMutation = useDeleteNoteFolder({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!folder) {
      return;
    }

    deleteFolderMutation.mutate({
      projectId,
      folderId: folder._id,
      featureId: folder.featureId,
    });
  }

  function handleClose() {
    if (deleteFolderMutation.isPending) {
      return;
    }

    deleteFolderMutation.reset();
    onClose();
  }

  const formError =
    deleteFolderMutation.error instanceof Error
      ? deleteFolderMutation.error.message
      : null;

  const destination = parentFolderName
    ? `“${parentFolderName}”`
    : "the root of Notes";

  const hasContents = childFolderCount > 0 || noteCount > 0;

  return (
    <Modal open={open} onClose={handleClose} title="Delete folder" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete
        {folder ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;{folder.name}&rdquo;
            </span>
          </>
        ) : null}
        ?
        {hasContents ? (
          <>
            {" "}
            Its contents (
            {childFolderCount > 0
              ? `${childFolderCount} ${childFolderCount === 1 ? "subfolder" : "subfolders"}`
              : null}
            {childFolderCount > 0 && noteCount > 0 ? " and " : null}
            {noteCount > 0
              ? `${noteCount} ${noteCount === 1 ? "note" : "notes"}`
              : null}
            ) will move to {destination}.
          </>
        ) : null}{" "}
        This action cannot be undone.
      </p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={deleteFolderMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteFolderMutation.isPending}
        >
          {deleteFolderMutation.isPending ? "Deleting..." : "Delete folder"}
        </Button>
      </div>
    </Modal>
  );
}
