"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateFeature } from "@/hooks/mutations/features/useCreateFeature";
import type { RequirementResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateFeatureModalProps = {
  open: boolean;
  projectId: string;
  requirements: RequirementResponse[];
  onClose: () => void;
  onSuccess: () => void;
};

function buildRequirementOptions(requirements: RequirementResponse[]) {
  return [
    { value: "", label: "No linked requirement" },
    ...requirements.map((requirement) => ({
      value: requirement._id,
      label: requirement.title.trim() || "Untitled requirement",
    })),
  ];
}

export default function CreateFeatureModal({
  open,
  projectId,
  requirements,
  onClose,
  onSuccess,
}: CreateFeatureModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createFeatureMutation = useCreateFeature({
    onSuccess: () => {
      setTitle("");
      setContent("");
      setRequirementId("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError("Feature name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Feature description is required");
      return;
    }

    setValidationError(null);
    createFeatureMutation.mutate({
      projectId,
      title: title.trim(),
      content,
      requirementId: requirementId || null,
    });
  }

  function handleClose() {
    if (createFeatureMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setRequirementId("");
    setValidationError(null);
    createFeatureMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createFeatureMutation.error instanceof Error
      ? createFeatureMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Feature">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="feature-title"
          label="Feature"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a name for this feature"
          autoFocus
        />

        <RichTextEditor
          key="create-feature"
          id="feature-content"
          label="Description"
          value={content}
          onChange={setContent}
        />

        <Select
          id="feature-requirement"
          label="Linked requirement (optional)"
          value={requirementId}
          onChange={(event) => setRequirementId(event.target.value)}
          options={buildRequirementOptions(requirements)}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createFeatureMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createFeatureMutation.isPending}>
            {createFeatureMutation.isPending ? "Adding..." : "Add feature"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
