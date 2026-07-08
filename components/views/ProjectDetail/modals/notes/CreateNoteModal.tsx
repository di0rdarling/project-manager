"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateNote } from "@/hooks/mutations/notes/useCreateNote";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateNoteModalProps = {
  open: boolean;
  projectId: string;
  featureId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateNoteModal({
  open,
  projectId,
  featureId,
  onClose,
  onSuccess,
}: CreateNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createNoteMutation = useCreateNote({
    onSuccess: () => {
      setTitle("");
      setContent("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError("Note title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Note content is required");
      return;
    }

    setValidationError(null);
    createNoteMutation.mutate({
      projectId,
      title: title.trim(),
      content,
      featureId: featureId ?? null,
    });
  }

  function handleClose() {
    if (createNoteMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setValidationError(null);
    createNoteMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createNoteMutation.error instanceof Error
      ? createNoteMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this note"
          autoFocus
        />

        <RichTextEditor
          key="create-note"
          id="content"
          label="Note"
          value={content}
          onChange={setContent}
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
