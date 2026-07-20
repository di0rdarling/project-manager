"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import CreateNoteModal from "@/components/views/ProjectDetail/modals/notes/CreateNoteModal";
import DeleteNoteModal from "@/components/views/ProjectDetail/modals/notes/DeleteNoteModal";
import NotesList from "@/components/views/ProjectDetail/NotesList";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import { useFetchProject } from "@/hooks/queries/useFetchProject";

interface ProjectNotesViewProps {
  projectId: string;
}

export default function ProjectNotesView({
  projectId,
}: Readonly<ProjectNotesViewProps>) {
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useFetchProject(projectId);

  const canFetchNotes = !isProjectPending && !isProjectError;

  const {
    data: notes = [],
    isPending: isNotesPending,
    isError: isNotesError,
    error: notesError,
  } = useFetchNotes(projectId, {
    enabled: canFetchNotes,
  });

  const isPending = isProjectPending || isNotesPending;
  const isError = isProjectError || isNotesError;
  const error = projectError ?? notesError;

  return (
    <PageContent>
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {project ? `Back to ${project.name}` : "Back to project"}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={!canFetchNotes}
          onClick={() => setIsCreateNoteModalOpen(true)}
        >
          Add Note
        </Button>
      </div>

      {isPending ? (
        <LoadingMessage>Loading notes...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load notes" />
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No notes yet. Add your first one to get started.
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setIsCreateNoteModalOpen(true)}
          >
            Add Note
          </Button>
        </div>
      ) : (
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
      )}

      <CreateNoteModal
        open={isCreateNoteModalOpen}
        projectId={projectId}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSuccess={() => toast.success("Note added successfully.")}
      />
    </PageContent>
  );
}
