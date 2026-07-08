"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteAgentNote } from "@/hooks/mutations/agent-notes/useDeleteAgentNote";
import type { AgentNoteResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteAgentNoteModalProps = {
  open: boolean;
  teammateId: string;
  note: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteAgentNoteModal({
  open,
  teammateId,
  note,
  onClose,
  onSuccess,
}: DeleteAgentNoteModalProps) {
  const deleteAgentNoteMutation = useDeleteAgentNote({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!note) {
      return;
    }

    deleteAgentNoteMutation.mutate({
      teammateId,
      noteId: note._id,
      sharedWithTeammateIds: note.sharedWithTeammateIds,
    });
  }

  function handleClose() {
    if (deleteAgentNoteMutation.isPending) {
      return;
    }

    deleteAgentNoteMutation.reset();
    onClose();
  }

  const formError =
    deleteAgentNoteMutation.error instanceof Error
      ? deleteAgentNoteMutation.error.message
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
          disabled={deleteAgentNoteMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteAgentNoteMutation.isPending}
        >
          {deleteAgentNoteMutation.isPending ? "Deleting..." : "Delete note"}
        </Button>
      </div>
    </Modal>
  );
}
