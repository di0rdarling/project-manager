"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteNote } from "@/hooks/mutations/notes/useDeleteNote";
import type { NoteResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteNoteModalProps = {
  open: boolean;
  projectId: string;
  note: NoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteNoteModal({
  open,
  projectId,
  note,
  onClose,
  onSuccess,
}: DeleteNoteModalProps) {
  const deleteNoteMutation = useDeleteNote({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!note) {
      return;
    }

    deleteNoteMutation.mutate({
      projectId,
      noteId: note._id,
      featureId: note.featureId,
    });
  }

  function handleClose() {
    if (deleteNoteMutation.isPending) {
      return;
    }

    deleteNoteMutation.reset();
    onClose();
  }

  const formError =
    deleteNoteMutation.error instanceof Error
      ? deleteNoteMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete note" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this note
        {note ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {note.title.trim() || getRichTextPreview(note.content)}
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
          disabled={deleteNoteMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteNoteMutation.isPending}
        >
          {deleteNoteMutation.isPending ? "Deleting..." : "Delete note"}
        </Button>
      </div>
    </Modal>
  );
}
