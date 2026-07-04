"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreatePainPoint } from "@/hooks/mutations/painPoints/useCreatePainPoint";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreatePainPointModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreatePainPointModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreatePainPointModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createPainPointMutation = useCreatePainPoint({
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
      setValidationError("Pain point title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Pain point description is required");
      return;
    }

    setValidationError(null);
    createPainPointMutation.mutate({
      projectId,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (createPainPointMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setValidationError(null);
    createPainPointMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createPainPointMutation.error instanceof Error
      ? createPainPointMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Pain Point">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What problem are core users facing?"
          autoFocus
        />

        <RichTextEditor
          key="create-pain-point"
          id="content"
          label="Description"
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
            disabled={createPainPointMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createPainPointMutation.isPending}>
            {createPainPointMutation.isPending ? "Adding..." : "Add pain point"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
