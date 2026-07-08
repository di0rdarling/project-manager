"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AISummarySection,
  type AISummaryMessages,
} from "@/components/ui/AISummarySection";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { useGenerateFeatureSummary } from "@/hooks/mutations/features/useGenerateFeatureSummary";
import { useDeleteFeatureSummary } from "@/hooks/mutations/features/useDeleteFeatureSummary";
import { useFetchFeature } from "@/hooks/queries/useFetchFeature";

const FEATURE_SUMMARY_MESSAGES: AISummaryMessages = {
  emptyDescription:
    "Generate an AI overview that synthesizes this feature's description, linked requirement, domain knowledge, current challenges, and notes.",
  generating: "Generating feature summary...",
  regenerating: "Regenerating feature summary...",
  generateError: "Failed to generate feature summary",
  regenerateError: "Failed to regenerate feature summary",
};

interface AIFeatureSummaryProps {
  projectId: string;
  featureId: string;
}

export default function AIFeatureSummary({
  projectId,
  featureId,
}: Readonly<AIFeatureSummaryProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegeneratingRef = useRef(false);
  const { data: feature, isFetching } = useFetchFeature(projectId, featureId);
  const {
    mutate: generateSummary,
    isPending: isGenerating,
    isSuccess,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateFeatureSummary({
    onSuccess: () => {
      toast.success(
        isRegeneratingRef.current
          ? "Feature summary regenerated successfully."
          : "Feature summary generated successfully.",
      );
    },
  });
  const deleteSummaryMutation = useDeleteFeatureSummary({
    onSuccess: () => {
      toast.success("Feature summary deleted successfully.");
      setIsDeleteModalOpen(false);
    },
  });

  function handleGenerate(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateSummary({ projectId, featureId });
  }

  function handleDeleteModalClose() {
    if (deleteSummaryMutation.isPending) {
      return;
    }

    deleteSummaryMutation.reset();
    setIsDeleteModalOpen(false);
  }

  return (
    <>
      <AISummarySection
        summary={feature?.aiSummary ?? null}
        isFetching={isFetching}
        isGenerating={isGenerating}
        isGenerateError={isGenerateError}
        generateError={generateError}
        isSuccess={isSuccess}
        messages={FEATURE_SUMMARY_MESSAGES}
        onGenerate={handleGenerate}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />

      <DeleteAISummaryModal
        open={isDeleteModalOpen}
        description="Are you sure you want to delete this AI-generated feature summary? You can generate a new one at any time."
        isPending={deleteSummaryMutation.isPending}
        error={deleteSummaryMutation.error}
        onClose={handleDeleteModalClose}
        onConfirm={() =>
          deleteSummaryMutation.mutate({ projectId, featureId })
        }
      />
    </>
  );
}
