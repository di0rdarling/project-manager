"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdatePainPoint } from "@/hooks/mutations/painPoints/useUpdatePainPoint";
import type { PainPointResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditPainPointModalProps = {
  open: boolean;
  projectId: string;
  painPoint: PainPointResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditPainPointModal({
  open,
  projectId,
  painPoint,
  onClose,
  onSuccess,
}: EditPainPointModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (painPoint) {
      setTitle(painPoint.title);
      setContent(painPoint.content);
      setValidationError(null);
    }
  }, [painPoint]);

  const updatePainPointMutation = useUpdatePainPoint({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!painPoint) {
      return;
    }

    if (!title.trim()) {
      setValidationError("Pain point title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Pain point description is required");
      return;
    }

    setValidationError(null);
    updatePainPointMutation.mutate({
      projectId,
      painPointId: painPoint._id,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (updatePainPointMutation.isPending) {
      return;
    }

    setValidationError(null);
    updatePainPointMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updatePainPointMutation.error instanceof Error
      ? updatePainPointMutation.error.message
      : null);

  if (!open || !painPoint) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit pain point">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What problem are core users facing?"
          autoFocus
        />

        <RichTextEditor
          key={painPoint._id}
          id="edit-content"
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
            disabled={updatePainPointMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updatePainPointMutation.isPending}>
            {updatePainPointMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
