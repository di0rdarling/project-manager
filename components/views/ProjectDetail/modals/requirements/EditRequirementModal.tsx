"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateRequirement } from "@/hooks/mutations/requirements/useUpdateRequirement";
import type { RequirementResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditRequirementModalProps = {
  open: boolean;
  projectId: string;
  requirement: RequirementResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditRequirementModal({
  open,
  projectId,
  requirement,
  onClose,
  onSuccess,
}: EditRequirementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (requirement) {
      setTitle(requirement.title);
      setContent(requirement.content);
      setValidationError(null);
    }
  }, [requirement]);

  const updateRequirementMutation = useUpdateRequirement({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requirement) {
      return;
    }

    if (!title.trim()) {
      setValidationError("Requirement title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Requirement content is required");
      return;
    }

    setValidationError(null);
    updateRequirementMutation.mutate({
      projectId,
      requirementId: requirement._id,
      title: title.trim(),
      content,
    });
  }

  function handleClose() {
    if (updateRequirementMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateRequirementMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateRequirementMutation.error instanceof Error
      ? updateRequirementMutation.error.message
      : null);

  if (!open || !requirement) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit requirement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-requirement-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this requirement"
          autoFocus
        />

        <RichTextEditor
          key={requirement._id}
          id="edit-requirement-content"
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
            disabled={updateRequirementMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateRequirementMutation.isPending}>
            {updateRequirementMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
