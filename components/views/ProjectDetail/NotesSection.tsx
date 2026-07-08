"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import CreateNoteModal from "./modals/notes/CreateNoteModal";
import DeleteNoteModal from "./modals/notes/DeleteNoteModal";
import EditNoteModal from "./modals/notes/EditNoteModal";
import ProjectItemsList from "./ProjectItemsList";
import ProjectSection from "./ProjectSection";

type NotesSectionProps = {
  projectId: string;
  featureId?: string;
  enabled?: boolean;
  emptyMessage?: string;
};

export default function NotesSection({
  projectId,
  featureId,
  enabled = true,
  emptyMessage = "No notes yet. Add your first one to get started.",
}: Readonly<NotesSectionProps>) {
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  const {
    data: notes = [],
    isPending,
    isError,
    error,
  } = useFetchNotes(projectId, {
    featureId: featureId ?? null,
    enabled,
  });

  return (
    <>
      <ProjectSection
        title="Notes"
        addButtonLabel="Add Note"
        onAddClick={() => setIsCreateNoteModalOpen(true)}
        isPending={isPending}
        isError={isError}
        error={error}
        loadingMessage="Loading notes..."
        errorFallbackMessage="Failed to load notes"
        isEmpty={notes.length === 0}
        emptyMessage={emptyMessage}
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
        featureId={featureId}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSuccess={() => toast.success("Note added successfully.")}
      />
    </>
  );
}
