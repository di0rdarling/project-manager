"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateRequirement } from "@/hooks/mutations/requirements/useCreateRequirement";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateRequirementModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateRequirementModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreateRequirementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createRequirementMutation = useCreateRequirement({
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
      setValidationError("Requirement title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Requirement content is required");
      return;
    }

    setValidationError(null);
    createRequirementMutation.mutate({
      projectId,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (createRequirementMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setValidationError(null);
    createRequirementMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createRequirementMutation.error instanceof Error
      ? createRequirementMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Requirement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="requirement-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this requirement"
          autoFocus
        />

        <RichTextEditor
          key="create-requirement"
          id="requirement-content"
          label="Requirement"
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
            disabled={createRequirementMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createRequirementMutation.isPending}>
            {createRequirementMutation.isPending
              ? "Adding..."
              : "Add requirement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
