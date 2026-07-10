"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { MultiSelect } from "@/components/ui/inputs/MultiSelect";
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
  return requirements.map((requirement) => ({
    value: requirement._id,
    label: requirement.title.trim() || "Untitled requirement",
  }));
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
  const [requirementIds, setRequirementIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createFeatureMutation = useCreateFeature({
    onSuccess: () => {
      setTitle("");
      setContent("");
      setRequirementIds([]);
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
      requirementIds,
    });
  }

  function handleClose() {
    if (createFeatureMutation.isPending) {
      return;
    }

    setTitle("");
    setContent("");
    setRequirementIds([]);
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

        <MultiSelect
          id="feature-requirements"
          label="Linked requirements (optional)"
          options={buildRequirementOptions(requirements)}
          values={requirementIds}
          onChange={setRequirementIds}
          placeholder="Select requirements"
          emptyMessage="No requirements yet. Add requirements to link them to this feature."
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
