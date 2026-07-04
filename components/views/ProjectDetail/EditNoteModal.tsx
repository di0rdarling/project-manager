"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useUpdateNote } from "@/hooks/mutations/useUpdateNote";
import type { NoteResponse } from "@/lib/types";

type EditNoteModalProps = {
  open: boolean;
  projectId: string;
  note: NoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditNoteModal({
  open,
  projectId,
  note,
  onClose,
  onSuccess,
}: EditNoteModalProps) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  const updateNoteMutation = useUpdateNote({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note) {
      return;
    }

    updateNoteMutation.mutate({
      projectId,
      noteId: note._id,
      content,
    });
  }

  function handleClose() {
    if (updateNoteMutation.isPending) {
      return;
    }

    updateNoteMutation.reset();
    onClose();
  }

  const formError =
    updateNoteMutation.error instanceof Error
      ? updateNoteMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Edit note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          id="edit-content"
          label="Note"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your note..."
          rows={5}
          required
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateNoteMutation.isPending}>
            {updateNoteMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
