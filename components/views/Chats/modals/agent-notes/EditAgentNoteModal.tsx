"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateAgentNote } from "@/hooks/mutations/agent-notes/useUpdateAgentNote";
import type { AgentNoteResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditAgentNoteModalProps = {
  open: boolean;
  teammateId: string;
  note: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditAgentNoteModal({
  open,
  teammateId,
  note,
  onClose,
  onSuccess,
}: EditAgentNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setValidationError(null);
    }
  }, [note]);

  const updateAgentNoteMutation = useUpdateAgentNote({
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

    if (!title.trim()) {
      setValidationError("Note title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Note content is required");
      return;
    }

    setValidationError(null);
    updateAgentNoteMutation.mutate({
      teammateId,
      noteId: note._id,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (updateAgentNoteMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateAgentNoteMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateAgentNoteMutation.error instanceof Error
      ? updateAgentNoteMutation.error.message
      : null);

  if (!open || !note) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this note"
          autoFocus
        />

        <RichTextEditor
          key={note._id}
          id="edit-content"
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
            disabled={updateAgentNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateAgentNoteMutation.isPending}>
            {updateAgentNoteMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
