"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateAgentNote } from "@/hooks/mutations/agent-notes/useCreateAgentNote";
import type { ChatTeammateId } from "@/lib/chat-teammates";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateAgentNoteModalProps = {
  open: boolean;
  teammateId: ChatTeammateId;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateAgentNoteModal({
  open,
  teammateId,
  onClose,
  onSuccess,
}: CreateAgentNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createAgentNoteMutation = useCreateAgentNote({
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
    createAgentNoteMutation.mutate({
      teammateId,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (createAgentNoteMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setValidationError(null);
    createAgentNoteMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createAgentNoteMutation.error instanceof Error
      ? createAgentNoteMutation.error.message
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
          key="create-agent-note"
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
            disabled={createAgentNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createAgentNoteMutation.isPending}>
            {createAgentNoteMutation.isPending ? "Adding..." : "Add note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
