"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateNote } from "@/hooks/mutations/useCreateNote";

type CreateNoteModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateNoteModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreateNoteModalProps) {
  const [content, setContent] = useState("");

  const createNoteMutation = useCreateNote({
    onSuccess: () => {
      setContent("");
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createNoteMutation.mutate({ projectId, content });
  }

  function handleClose() {
    if (createNoteMutation.isPending) {
      return;
    }

    setContent("");
    createNoteMutation.reset();
    onClose();
  }

  const formError =
    createNoteMutation.error instanceof Error
      ? createNoteMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="New Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          id="content"
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
            disabled={createNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createNoteMutation.isPending}>
            {createNoteMutation.isPending ? "Adding..." : "Add note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
