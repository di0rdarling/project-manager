"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AISummarySection,
  type AISummaryMessages,
} from "@/components/ui/AISummarySection";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { useGenerateProjectSummary } from "@/hooks/mutations/projects/useGenerateProjectSummary";
import { useDeleteProjectSummary } from "@/hooks/mutations/projects/useDeleteProjectSummary";
import { useFetchProject } from "@/hooks/queries/useFetchProject";

const PROJECT_SUMMARY_MESSAGES: AISummaryMessages = {
  emptyDescription:
    "Generate an AI overview that synthesizes this project's description, core users, pain points, current challenges, requirements, tools, and notes.",
  generating: "Generating project summary...",
  regenerating: "Regenerating project summary...",
  generateError: "Failed to generate project summary",
  regenerateError: "Failed to regenerate project summary",
};

interface AIProjectSummaryProps {
  projectId: string;
}

export default function AIProjectSummary({
  projectId,
}: Readonly<AIProjectSummaryProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegeneratingRef = useRef(false);
  const { data: project, isFetching } = useFetchProject(projectId);
  const {
    mutate: generateSummary,
    isPending: isGenerating,
    isSuccess,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateProjectSummary({
    onSuccess: () => {
      toast.success(
        isRegeneratingRef.current
          ? "Project summary regenerated successfully."
          : "Project summary generated successfully.",
      );
    },
  });
  const deleteSummaryMutation = useDeleteProjectSummary({
    onSuccess: () => {
      toast.success("Project summary deleted successfully.");
      setIsDeleteModalOpen(false);
    },
  });

  function handleGenerate(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateSummary(projectId);
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
        summary={project?.aiSummary ?? null}
        sectionId="overview"
        isFetching={isFetching}
        isGenerating={isGenerating}
        isGenerateError={isGenerateError}
        generateError={generateError}
        isSuccess={isSuccess}
        messages={PROJECT_SUMMARY_MESSAGES}
        onGenerate={handleGenerate}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />

      <DeleteAISummaryModal
        open={isDeleteModalOpen}
        description="Are you sure you want to delete this AI-generated project summary? You can generate a new one at any time."
        isPending={deleteSummaryMutation.isPending}
        error={deleteSummaryMutation.error}
        onClose={handleDeleteModalClose}
        onConfirm={() => deleteSummaryMutation.mutate(projectId)}
      />
    </>
  );
}
