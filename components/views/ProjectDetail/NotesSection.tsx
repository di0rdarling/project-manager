"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import CreateNoteModal from "./modals/notes/CreateNoteModal";
import DeleteNoteModal from "./modals/notes/DeleteNoteModal";
import NotesList from "./NotesList";
import ProjectSection from "./ProjectSection";

type NotesSectionProps = {
  projectId: string;
  featureId?: string;
  enabled?: boolean;
  emptyMessage?: string;
  sectionId?: string;
};

export default function NotesSection({
  projectId,
  featureId,
  enabled = true,
  emptyMessage = "No notes yet. Add your first one to get started.",
  sectionId,
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
        sectionId={sectionId}
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
        <NotesList
          projectId={projectId}
          notes={notes}
          onDeleteSuccess={() => toast.success("Note deleted successfully.")}
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
