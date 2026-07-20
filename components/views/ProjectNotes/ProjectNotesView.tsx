"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import CreateNoteModal from "@/components/views/ProjectDetail/modals/notes/CreateNoteModal";
import NotesBrowser from "@/components/views/ProjectNotes/NotesBrowser";
import CreateFolderModal from "@/components/views/ProjectNotes/modals/CreateFolderModal";
import DeleteFolderModal from "@/components/views/ProjectNotes/modals/DeleteFolderModal";
import EditFolderModal from "@/components/views/ProjectNotes/modals/EditFolderModal";
import { useFetchNoteFolders } from "@/hooks/queries/useFetchNoteFolders";
import { useFetchNotes } from "@/hooks/queries/useFetchNotes";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { getProjectNotesPath } from "@/lib/notes";
import type { NoteFolderResponse } from "@/lib/types";

interface ProjectNotesViewProps {
  projectId: string;
}

export default function ProjectNotesView({
  projectId,
}: Readonly<ProjectNotesViewProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [createNoteFolderId, setCreateNoteFolderId] = useState<string | null>(
    null,
  );
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<
    string | null
  >(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<NoteFolderResponse | null>(
    null,
  );
  const [folderToDelete, setFolderToDelete] =
    useState<NoteFolderResponse | null>(null);

  useEffect(() => {
    if (searchParams.get("folder")) {
      router.replace(getProjectNotesPath(projectId));
    }
  }, [projectId, router, searchParams]);

  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useFetchProject(projectId);

  const canFetch = !isProjectPending && !isProjectError;

  const {
    data: notes = [],
    isPending: isNotesPending,
    isError: isNotesError,
    error: notesError,
  } = useFetchNotes(projectId, {
    enabled: canFetch,
  });

  const {
    data: folders = [],
    isPending: isFoldersPending,
    isError: isFoldersError,
    error: foldersError,
  } = useFetchNoteFolders(projectId, {
    enabled: canFetch,
  });

  const isPending = isProjectPending || isNotesPending || isFoldersPending;
  const isError = isProjectError || isNotesError || isFoldersError;
  const error = projectError ?? notesError ?? foldersError;

  const deleteFolderChildCount = useMemo(() => {
    if (!folderToDelete) {
      return 0;
    }

    return folders.filter(
      (folder) => folder.parentFolderId === folderToDelete._id,
    ).length;
  }, [folderToDelete, folders]);

  const deleteFolderNoteCount = useMemo(() => {
    if (!folderToDelete) {
      return 0;
    }

    return notes.filter((note) => note.folderId === folderToDelete._id).length;
  }, [folderToDelete, notes]);

  const deleteFolderParentName = useMemo(() => {
    if (!folderToDelete?.parentFolderId) {
      return null;
    }

    return (
      folders.find((folder) => folder._id === folderToDelete.parentFolderId)
        ?.name ?? null
    );
  }, [folderToDelete, folders]);

  const isEmpty = folders.length === 0 && notes.length === 0;

  function openCreateFolderModal(parentFolderId: string | null) {
    setCreateFolderParentId(parentFolderId);
    setIsCreateFolderModalOpen(true);
  }

  function openCreateNoteModal(folderId: string | null) {
    setCreateNoteFolderId(folderId);
    setIsCreateNoteModalOpen(true);
  }

  function handleDeleteFolderSuccess() {
    toast.success("Folder deleted successfully.");
    setFolderToDelete(null);
  }

  return (
    <PageContent>
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {project ? `Back to ${project.name}` : "Back to project"}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!canFetch}
            onClick={() => openCreateFolderModal(null)}
          >
            New Folder
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canFetch}
            onClick={() => openCreateNoteModal(null)}
          >
            Add Note
          </Button>
        </div>
      </div>

      {isPending ? (
        <LoadingMessage>Loading notes...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load notes" />
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No notes yet. Add your first one to get started.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => openCreateFolderModal(null)}
            >
              New Folder
            </Button>
            <Button type="button" onClick={() => openCreateNoteModal(null)}>
              Add Note
            </Button>
          </div>
        </div>
      ) : (
        <NotesBrowser
          projectId={projectId}
          rootFolderId={null}
          allFolders={folders}
          allNotes={notes}
          onEditFolder={setFolderToEdit}
          onDeleteFolder={setFolderToDelete}
          onCreateFolder={openCreateFolderModal}
          onCreateNote={openCreateNoteModal}
          onDeleteNoteSuccess={() => toast.success("Note deleted successfully.")}
          onMoveNoteSuccess={() => toast.success("Note moved successfully.")}
        />
      )}

      <CreateNoteModal
        open={isCreateNoteModalOpen}
        projectId={projectId}
        folderId={createNoteFolderId}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onSuccess={() => toast.success("Note added successfully.")}
      />

      <CreateFolderModal
        open={isCreateFolderModalOpen}
        projectId={projectId}
        parentFolderId={createFolderParentId}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSuccess={() => toast.success("Folder created successfully.")}
      />

      <EditFolderModal
        open={folderToEdit !== null}
        projectId={projectId}
        folder={folderToEdit}
        folders={folders}
        onClose={() => setFolderToEdit(null)}
        onSuccess={() => toast.success("Folder updated successfully.")}
      />

      <DeleteFolderModal
        open={folderToDelete !== null}
        projectId={projectId}
        folder={folderToDelete}
        childFolderCount={deleteFolderChildCount}
        noteCount={deleteFolderNoteCount}
        parentFolderName={deleteFolderParentName}
        onClose={() => setFolderToDelete(null)}
        onSuccess={handleDeleteFolderSuccess}
      />
    </PageContent>
  );
}
