"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFetchDomainKnowledge } from "@/hooks/queries/useFetchDomainKnowledge";
import CreateDomainKnowledgeModal from "./modals/domainKnowledge/CreateDomainKnowledgeModal";
import DeleteDomainKnowledgeModal from "./modals/domainKnowledge/DeleteDomainKnowledgeModal";
import EditDomainKnowledgeModal from "./modals/domainKnowledge/EditDomainKnowledgeModal";
import DomainKnowledgeItemsList from "./DomainKnowledgeItemsList";
import ProjectSection from "./ProjectSection";

type DomainKnowledgeSectionProps = {
  projectId: string;
  featureId?: string;
  enabled?: boolean;
  emptyMessage?: string;
};

export default function DomainKnowledgeSection({
  projectId,
  featureId,
  enabled = true,
  emptyMessage = "No domain knowledge yet. Capture terms, concepts, and what you still want to learn.",
}: Readonly<DomainKnowledgeSectionProps>) {
  const [isCreateDomainKnowledgeModalOpen, setIsCreateDomainKnowledgeModalOpen] =
    useState(false);

  const {
    data: domainKnowledge = [],
    isPending,
    isError,
    error,
  } = useFetchDomainKnowledge(projectId, {
    featureId: featureId ?? null,
    enabled,
  });

  return (
    <>
      <ProjectSection
        title="Domain Knowledge"
        addButtonLabel="Add Domain Knowledge"
        onAddClick={() => setIsCreateDomainKnowledgeModalOpen(true)}
        isPending={isPending}
        isError={isError}
        error={error}
        loadingMessage="Loading domain knowledge..."
        errorFallbackMessage="Failed to load domain knowledge"
        isEmpty={domainKnowledge.length === 0}
        emptyMessage={emptyMessage}
      >
        <DomainKnowledgeItemsList
          items={domainKnowledge}
          onEditSuccess={() =>
            toast.success("Domain knowledge updated successfully.")
          }
          onDeleteSuccess={() =>
            toast.success("Domain knowledge deleted successfully.")
          }
          renderEditModal={({ open, item, onClose, onSuccess }) => (
            <EditDomainKnowledgeModal
              open={open}
              projectId={projectId}
              domainKnowledge={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
          renderDeleteModal={({ open, item, onClose, onSuccess }) => (
            <DeleteDomainKnowledgeModal
              open={open}
              projectId={projectId}
              domainKnowledge={item}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        />
      </ProjectSection>

      <CreateDomainKnowledgeModal
        open={isCreateDomainKnowledgeModalOpen}
        projectId={projectId}
        featureId={featureId}
        onClose={() => setIsCreateDomainKnowledgeModalOpen(false)}
        onSuccess={() => toast.success("Domain knowledge added successfully.")}
      />
    </>
  );
}
