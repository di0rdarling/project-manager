"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { useFetchRequirements } from "@/hooks/queries/useFetchRequirements";
import { formatDisplayDate } from "@/lib/dates";
import CreateNoteModal from "./modals/notes/CreateNoteModal";
import CreateRequirementModal from "./modals/requirements/CreateRequirementModal";
import DeleteNoteModal from "./modals/notes/DeleteNoteModal";
import DeleteRequirementModal from "./modals/requirements/DeleteRequirementModal";
import EditNoteModal from "./modals/notes/EditNoteModal";
import EditRequirementModal from "./modals/requirements/EditRequirementModal";
import ProjectItemsList from "./ProjectItemsList";
import ProjectSection from "./ProjectSection";
import AIProjectSummary from "./AIProjectSummary";

interface ProjectDetailViewProps {
  projectId: string;
}

export default function ProjectDetailView({
  projectId,
}: Readonly<ProjectDetailViewProps>) {
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] =
    useState(false);

  const { data: project, isPending, isError, error } =
    useFetchProject(projectId);

  const canFetchSections = !isPending && !isError;

  const {
    data: notes = [],
    isPending: isNotesPending,
    isError: isNotesError,
    error: notesError,
  } = useFetchNotes(projectId, { enabled: canFetchSections });

  const {
    data: requirements = [],
    isPending: isRequirementsPending,
    isError: isRequirementsError,
    error: requirementsError,
  } = useFetchRequirements(projectId, { enabled: canFetchSections });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to projects
      </Link>

      {isPending ? (
        <LoadingMessage>Loading project...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load project" />
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
            {project.description ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>
            ) : null}
            <p className="text-xs text-zinc-500">
              Created {formatDisplayDate(project.createdAt)}
            </p>
          </div>

          <AIProjectSummary projectId={projectId} />

          <ProjectSection
            title="Requirements"
            addButtonLabel="Add Requirement"
            onAddClick={() => setIsCreateRequirementModalOpen(true)}
            isPending={isRequirementsPending}
            isError={isRequirementsError}
            error={requirementsError}
            loadingMessage="Loading requirements..."
            errorFallbackMessage="Failed to load requirements"
            isEmpty={requirements.length === 0}
            emptyMessage="No requirements yet. Add your first one to get started."
          >
            <ProjectItemsList
              items={requirements}
              itemLabel="requirement"
              onEditSuccess={() =>
                toast.success("Requirement updated successfully.")
              }
              onDeleteSuccess={() =>
                toast.success("Requirement deleted successfully.")
              }
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditRequirementModal
                  open={open}
                  projectId={projectId}
                  requirement={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteRequirementModal
                  open={open}
                  projectId={projectId}
                  requirement={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>

          <ProjectSection
            title="Notes"
            addButtonLabel="Add Note"
            onAddClick={() => setIsCreateNoteModalOpen(true)}
            isPending={isNotesPending}
            isError={isNotesError}
            error={notesError}
            loadingMessage="Loading notes..."
            errorFallbackMessage="Failed to load notes"
            isEmpty={notes.length === 0}
            emptyMessage="No notes yet. Add your first one to get started."
          >
            <ProjectItemsList
              items={notes}
              itemLabel="note"
              onEditSuccess={() => toast.success("Note updated successfully.")}
              onDeleteSuccess={() => toast.success("Note deleted successfully.")}
              renderEditModal={({ open, item, onClose, onSuccess }) => (
                <EditNoteModal
                  open={open}
                  projectId={projectId}
                  note={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
              renderDeleteModal={({ open, item, onClose, onSuccess }) => (
                <DeleteNoteModal
                  open={open}
                  projectId={projectId}
                  note={item}
                  onClose={onClose}
                  onSuccess={onSuccess}
                />
              )}
            />
          </ProjectSection>
          <CreateNoteModal
            open={isCreateNoteModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateNoteModalOpen(false)}
            onSuccess={() => toast.success("Note added successfully.")}
          />

          <CreateRequirementModal
            open={isCreateRequirementModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateRequirementModalOpen(false)}
            onSuccess={() => toast.success("Requirement added successfully.")}
          />
        </>
      )}
    </div>
  );
}
