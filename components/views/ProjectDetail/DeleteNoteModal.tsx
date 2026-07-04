"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteNote } from "@/hooks/mutations/useDeleteNote";
import type { NoteResponse } from "@/lib/types";

type DeleteNoteModalProps = {
  open: boolean;
  projectId: string;
  note: NoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

function getNotePreview(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }

  return `${trimmed.slice(0, 80)}...`;
}

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

    deleteNoteMutation.mutate({ projectId, noteId: note._id });
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
    <Modal open={open} onClose={handleClose} title="Delete note">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this note
        {note ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;{getNotePreview(note.content)}&rdquo;
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
