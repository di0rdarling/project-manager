"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { formatDisplayDate } from "@/lib/dates";
import CreateNoteModal from "./CreateNoteModal";
import ProjectNotesList from "./ProjectNotesList";

interface ProjectDetailViewProps {
  projectId: string;
}

export default function ProjectDetailView({
  projectId,
}: Readonly<ProjectDetailViewProps>) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: project, isPending, isError, error } =
    useFetchProject(projectId);

  const {
    data: notes = [],
    isPending: isNotesPending,
    isError: isNotesError,
    error: notesError,
  } = useFetchNotes(projectId, { enabled: !isPending && !isError });

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

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

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notes</h2>
              <Button type="button" onClick={openCreateModal} className="shrink-0">
                Add Note
              </Button>
            </div>

            {isNotesPending ? (
              <LoadingMessage>Loading notes...</LoadingMessage>
            ) : isNotesError ? (
              <ErrorMessage
                error={notesError}
                fallbackMessage="Failed to load notes"
              />
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No notes yet. Add your first one to get started.
                </p>
                <Button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4"
                >
                  Add Note
                </Button>
              </div>
            ) : (
              <ProjectNotesList
                projectId={projectId}
                notes={notes}
                onDeleteSuccess={() => toast.success("Note deleted successfully.")}
              />
            )}
          </section>

          <CreateNoteModal
            open={isCreateModalOpen}
            projectId={projectId}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => toast.success("Note added successfully.")}
          />
        </>
      )}
    </div>
  );
}
