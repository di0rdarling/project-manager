"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFetchChallenges } from "@/hooks/queries/useFetchChallenges";
import CreateChallengeModal from "./modals/challenges/CreateChallengeModal";
import DeleteChallengeModal from "./modals/challenges/DeleteChallengeModal";
import EditChallengeModal from "./modals/challenges/EditChallengeModal";
import ChallengesItemsList from "./ChallengesItemsList";
import ProjectSection from "./ProjectSection";
import type { ProjectDetailSectionId } from "@/lib/project-detail-sections";

type ChallengesSectionProps = {
  projectId: string;
  featureId?: string;
  enabled?: boolean;
  emptyMessage?: string;
  sectionId?: ProjectDetailSectionId;
};

export default function ChallengesSection({
  projectId,
  featureId,
  enabled = true,
  emptyMessage = "No challenges recorded yet. Add any current issues or blockers you're facing.",
  sectionId,
}: Readonly<ChallengesSectionProps>) {
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] =
    useState(false);

  const {
    data: challenges = [],
    isPending,
    isError,
    error,
  } = useFetchChallenges(projectId, {
    featureId: featureId ?? null,
    enabled,
  });

  return (
    <>
      <ProjectSection
        title="Current Challenges"
        sectionId={sectionId}
        addButtonLabel="Add Challenge"
        onAddClick={() => setIsCreateChallengeModalOpen(true)}
        isPending={isPending}
        isError={isError}
        error={error}
        loadingMessage="Loading challenges..."
        errorFallbackMessage="Failed to load challenges"
        isEmpty={challenges.length === 0}
        emptyMessage={emptyMessage}
      >
        <ChallengesItemsList
          items={challenges}
          onEditSuccess={() => toast.success("Challenge updated successfully.")}
          onDeleteSuccess={() =>
            toast.success("Challenge deleted successfully.")
          }
          renderEditModal={({ open, item, onClose, onSuccess }) => (
            <EditChallengeModal
              open={open}
              projectId={projectId}
              challenge={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
          renderDeleteModal={({ open, item, onClose, onSuccess }) => (
            <DeleteChallengeModal
              open={open}
              projectId={projectId}
              challenge={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        />
      </ProjectSection>

      <CreateChallengeModal
        open={isCreateChallengeModalOpen}
        projectId={projectId}
        featureId={featureId}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onSuccess={() => toast.success("Challenge added successfully.")}
      />
    </>
  );
}
