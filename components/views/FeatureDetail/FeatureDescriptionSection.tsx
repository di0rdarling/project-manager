"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { DocumentDetailContent } from "@/components/views/document-detail/DocumentDetailContent";
import { useUpdateFeature } from "@/hooks/mutations/features/useUpdateFeature";
import { useRegisterProjectSection } from "@/hooks/useRegisterProjectSection";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { FeatureResponse } from "@/lib/types";

type FeatureDescriptionSectionProps = {
  projectId: string;
  feature: FeatureResponse;
};

export default function FeatureDescriptionSection({
  projectId,
  feature,
}: Readonly<FeatureDescriptionSectionProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(feature.content);
  const [validationError, setValidationError] = useState<string | null>(null);

  useRegisterProjectSection("description", sectionRef);

  useEffect(() => {
    if (!isEditing) {
      setContent(feature.content);
      setValidationError(null);
    }
  }, [feature.content, isEditing]);

  const updateFeatureMutation = useUpdateFeature({
    onSuccess: () => {
      toast.success("Feature description saved.");
      setIsEditing(false);
      setValidationError(null);
    },
    onError: (error) => {
      setValidationError(error.message);
    },
  });

  function startEditing() {
    setContent(feature.content);
    setValidationError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (updateFeatureMutation.isPending) {
      return;
    }

    setContent(feature.content);
    setValidationError(null);
    setIsEditing(false);
  }

  function handleSave() {
    if (isRichTextEmpty(content)) {
      setValidationError("Feature description is required");
      return;
    }

    setValidationError(null);
    updateFeatureMutation.mutate({
      projectId,
      featureId: feature._id,
      title: feature.title,
      content,
      requirementIds: feature.requirementIds,
    });
  }

  const editToolbarActions = (
    <>
      <IconButton
        type="button"
        aria-label="Cancel editing"
        onClick={cancelEditing}
        disabled={updateFeatureMutation.isPending}
      >
        <XMarkIcon className="size-4" />
      </IconButton>
      <IconButton
        type="button"
        aria-label="Save description"
        onClick={handleSave}
        disabled={updateFeatureMutation.isPending}
      >
        <CheckIcon className="size-4" />
      </IconButton>
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="description"
      className="scroll-mt-6 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Description
        </h2>
        {!isEditing ? (
          <IconButton
            type="button"
            aria-label="Edit description"
            onClick={startEditing}
          >
            <PencilIcon className="size-4" />
          </IconButton>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <DocumentDetailContent
          documentId={feature._id}
          contentInputId="feature-description-content"
          isEditing={isEditing}
          editContent={content}
          readContent={feature.content}
          headings={[]}
          onContentChange={setContent}
          contentLabel="Feature description"
          toolbarActions={editToolbarActions}
        />
      </div>

      {validationError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
      ) : null}
    </section>
  );
}
