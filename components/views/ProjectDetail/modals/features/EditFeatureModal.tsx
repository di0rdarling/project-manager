"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateFeature } from "@/hooks/mutations/features/useUpdateFeature";
import type { FeatureResponse, RequirementResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditFeatureModalProps = {
  open: boolean;
  projectId: string;
  feature: FeatureResponse | null;
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

export default function EditFeatureModal({
  open,
  projectId,
  feature,
  requirements,
  onClose,
  onSuccess,
}: EditFeatureModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (feature) {
      setTitle(feature.title);
      setContent(feature.content);
      setRequirementId(feature.requirementId ?? "");
      setValidationError(null);
    }
  }, [feature]);

  const updateFeatureMutation = useUpdateFeature({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feature) {
      return;
    }

    if (!title.trim()) {
      setValidationError("Feature name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Feature description is required");
      return;
    }

    setValidationError(null);
    updateFeatureMutation.mutate({
      projectId,
      featureId: feature._id,
      title: title.trim(),
      content,
      requirementId: requirementId || null,
    });
  }

  function handleClose() {
    if (updateFeatureMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateFeatureMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateFeatureMutation.error instanceof Error
      ? updateFeatureMutation.error.message
      : null);

  if (!open || !feature) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit feature">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-feature-title"
          label="Feature"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a name for this feature"
          autoFocus
        />

        <RichTextEditor
          key={feature._id}
          id="edit-feature-content"
          label="Description"
          value={content}
          onChange={setContent}
        />

        <Select
          id="edit-feature-requirement"
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
            disabled={updateFeatureMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateFeatureMutation.isPending}>
            {updateFeatureMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
