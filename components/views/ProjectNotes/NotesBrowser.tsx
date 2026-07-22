"use client";

import Link from "next/link";
import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import {
  ChevronRightIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import {
  deleteItemAction,
  editItemAction,
  ItemActionsMenu,
} from "@/components/ui/ItemActionsMenu";
import DeleteNoteModal from "@/components/views/ProjectDetail/modals/notes/DeleteNoteModal";
import MoveNoteModal from "@/components/views/ProjectNotes/modals/MoveNoteModal";
import { useMoveNote } from "@/hooks/mutations/notes/useMoveNote";
import { getChildFolders } from "@/lib/note-folders";
import { getNoteDetailPath } from "@/lib/notes";
import type { NoteFolderResponse, NoteResponse } from "@/lib/types";

const NOTE_DRAG_MIME = "application/x-note-id";

type NotesBrowserProps = {
  projectId: string;
  rootFolderId: string | null;
  allFolders: NoteFolderResponse[];
  allNotes: NoteResponse[];
  onEditFolder: (folder: NoteFolderResponse) => void;
  onDeleteFolder: (folder: NoteFolderResponse) => void;
  onCreateFolder: (parentFolderId: string | null) => void;
  onCreateNote: (folderId: string | null) => void;
  onDeleteNoteSuccess?: () => void;
  onMoveNoteSuccess?: () => void;
};

function notesInFolder(
  notes: NoteResponse[],
  folderId: string | null,
): NoteResponse[] {
  return notes
    .filter((note) =>
      folderId ? note.folderId === folderId : !note.folderId,
    )
    .sort((a, b) =>
      (a.title.trim() || "Untitled note").localeCompare(
        b.title.trim() || "Untitled note",
      ),
    );
}

export default function NotesBrowser({
  projectId,
  rootFolderId,
  allFolders,
  allNotes,
  onEditFolder,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onDeleteNoteSuccess,
  onMoveNoteSuccess,
}: Readonly<NotesBrowserProps>) {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(
    null,
  );
  const [noteToDelete, setNoteToDelete] = useState<NoteResponse | null>(null);
  const [noteToMove, setNoteToMove] = useState<NoteResponse | null>(null);

  const moveNoteMutation = useMoveNote({
    onSuccess: () => {
      onMoveNoteSuccess?.();
    },
  });

  const rootFolders = useMemo(
    () => getChildFolders(allFolders, rootFolderId),
    [allFolders, rootFolderId],
  );
  const rootNotes = useMemo(
    () => notesInFolder(allNotes, rootFolderId),
    [allNotes, rootFolderId],
  );

  function toggleFolder(folderId: string) {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  function expandAndCreateFolder(parentFolderId: string) {
    setExpandedFolderIds((current) => new Set(current).add(parentFolderId));
    onCreateFolder(parentFolderId);
  }

  function expandAndCreateNote(folderId: string) {
    setExpandedFolderIds((current) => new Set(current).add(folderId));
    onCreateNote(folderId);
  }

  function handleNoteDragStart(event: DragEvent<HTMLLIElement>, noteId: string) {
    event.dataTransfer.setData(NOTE_DRAG_MIME, noteId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedNoteId(noteId);
  }

  function handleNoteDragEnd() {
    setDraggedNoteId(null);
    setDropTargetFolderId(null);
  }

  function handleFolderDragOver(
    event: DragEvent<HTMLElement>,
    folderId: string,
  ) {
    if (!draggedNoteId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTargetFolderId(folderId);
  }

  function handleFolderDragLeave(
    event: DragEvent<HTMLElement>,
    folderId: string,
  ) {
    event.stopPropagation();

    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }

    if (dropTargetFolderId === folderId) {
      setDropTargetFolderId(null);
    }
  }

  function handleDropOnFolder(
    event: DragEvent<HTMLElement>,
    folderId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const noteId = event.dataTransfer.getData(NOTE_DRAG_MIME);
    setDraggedNoteId(null);
    setDropTargetFolderId(null);

    if (!noteId) {
      return;
    }

    const note = allNotes.find((item) => item._id === noteId);
    if (!note || note.folderId === folderId || moveNoteMutation.isPending) {
      return;
    }

    setExpandedFolderIds((current) => new Set(current).add(folderId));
    moveNoteMutation.mutate({
      projectId,
      noteId,
      folderId,
    });
  }

  if (rootFolders.length === 0 && rootNotes.length === 0) {
    return null;
  }

  return (
    <>
      <div
        aria-label="Notes and folders"
        className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
      >
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rootFolders.map((folder) => (
            <FolderTreeNode
              key={folder._id}
              projectId={projectId}
              folder={folder}
              allFolders={allFolders}
              allNotes={allNotes}
              depth={0}
              expandedFolderIds={expandedFolderIds}
              draggedNoteId={draggedNoteId}
              dropTargetFolderId={dropTargetFolderId}
              onToggle={toggleFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={expandAndCreateFolder}
              onCreateNote={expandAndCreateNote}
              onMoveNote={setNoteToMove}
              onDeleteNote={setNoteToDelete}
              onNoteDragStart={handleNoteDragStart}
              onNoteDragEnd={handleNoteDragEnd}
              onFolderDragOver={handleFolderDragOver}
              onFolderDragLeave={handleFolderDragLeave}
              onFolderDrop={handleDropOnFolder}
            />
          ))}

          {rootNotes.map((note) => (
            <NoteRow
              key={note._id}
              projectId={projectId}
              note={note}
              depth={0}
              isDragging={draggedNoteId === note._id}
              onMove={() => setNoteToMove(note)}
              onDelete={() => setNoteToDelete(note)}
              onDragStart={handleNoteDragStart}
              onDragEnd={handleNoteDragEnd}
            />
          ))}
        </ul>
      </div>

      <DeleteNoteModal
        open={noteToDelete !== null}
        projectId={projectId}
        note={noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onSuccess={() => {
          setNoteToDelete(null);
          onDeleteNoteSuccess?.();
        }}
      />

      <MoveNoteModal
        open={noteToMove !== null}
        projectId={projectId}
        note={noteToMove}
        folders={allFolders}
        onClose={() => setNoteToMove(null)}
        onSuccess={() => {
          setNoteToMove(null);
          onMoveNoteSuccess?.();
        }}
      />
    </>
  );
}

type FolderTreeNodeProps = {
  projectId: string;
  folder: NoteFolderResponse;
  allFolders: NoteFolderResponse[];
  allNotes: NoteResponse[];
  depth: number;
  expandedFolderIds: Set<string>;
  draggedNoteId: string | null;
  dropTargetFolderId: string | null;
  onToggle: (folderId: string) => void;
  onEditFolder: (folder: NoteFolderResponse) => void;
  onDeleteFolder: (folder: NoteFolderResponse) => void;
  onCreateFolder: (parentFolderId: string) => void;
  onCreateNote: (folderId: string) => void;
  onMoveNote: (note: NoteResponse) => void;
  onDeleteNote: (note: NoteResponse) => void;
  onNoteDragStart: (event: DragEvent<HTMLLIElement>, noteId: string) => void;
  onNoteDragEnd: () => void;
  onFolderDragOver: (event: DragEvent<HTMLElement>, folderId: string) => void;
  onFolderDragLeave: (event: DragEvent<HTMLElement>, folderId: string) => void;
  onFolderDrop: (event: DragEvent<HTMLElement>, folderId: string) => void;
};

function FolderTreeNode({
  projectId,
  folder,
  allFolders,
  allNotes,
  depth,
  expandedFolderIds,
  draggedNoteId,
  dropTargetFolderId,
  onToggle,
  onEditFolder,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onMoveNote,
  onDeleteNote,
  onNoteDragStart,
  onNoteDragEnd,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}: Readonly<FolderTreeNodeProps>) {
  const isExpanded = expandedFolderIds.has(folder._id);
  const childFolders = getChildFolders(allFolders, folder._id);
  const childNotes = notesInFolder(allNotes, folder._id);
  const childCount = childFolders.length + childNotes.length;
  const isEmpty = childCount === 0;
  const isDropTarget = dropTargetFolderId === folder._id && draggedNoteId !== null;

  return (
    <li>
      <BrowserRow
        depth={depth}
        isDropTarget={isDropTarget}
        onDragOver={(event) => onFolderDragOver(event, folder._id)}
        onDragLeave={(event) => onFolderDragLeave(event, folder._id)}
        onDrop={(event) => onFolderDrop(event, folder._id)}
      >
        <button
          type="button"
          onClick={() => onToggle(folder._id)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <ChevronRightIcon
            className={`size-4 shrink-0 text-zinc-400 transition-transform dark:text-zinc-500 ${
              isExpanded ? "rotate-90" : ""
            }`}
            aria-hidden
          />
          <FolderIcon
            className={`size-5 shrink-0 ${
              isDropTarget
                ? "text-amber-700 dark:text-amber-300"
                : "text-amber-600 dark:text-amber-400"
            }`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {folder.name}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400 sm:hidden">
              {isDropTarget
                ? "Drop note here"
                : `${childCount} ${childCount === 1 ? "item" : "items"}`}
            </span>
          </span>
          <span className="hidden shrink-0 text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
            {isDropTarget
              ? "Drop note here"
              : `${childCount} ${childCount === 1 ? "item" : "items"}`}
          </span>
        </button>

        <div className="flex justify-end">
          <ItemActionsMenu
            actions={[
              {
                key: "new-folder",
                label: "New folder here",
                icon: <FolderPlusIcon className="size-4" aria-hidden />,
                onClick: () => onCreateFolder(folder._id),
              },
              {
                key: "new-note",
                label: "Add note here",
                icon: <DocumentPlusIcon className="size-4" aria-hidden />,
                onClick: () => onCreateNote(folder._id),
              },
              editItemAction("Edit folder", () => onEditFolder(folder)),
              deleteItemAction("Delete folder", () => onDeleteFolder(folder)),
            ]}
            menuLabel={`Actions for ${folder.name}`}
          />
        </div>
      </BrowserRow>

      {isExpanded ? (
        <ul
          className={`divide-y border-t transition dark:divide-zinc-800 dark:border-zinc-800 ${
            isDropTarget
              ? "divide-amber-200 border-amber-300 bg-amber-50/60 ring-2 ring-inset ring-amber-400/80 dark:divide-amber-900/50 dark:border-amber-800 dark:bg-amber-950/20 dark:ring-amber-500/80"
              : "divide-zinc-200 border-zinc-200"
          }`}
          onDragOver={(event) => onFolderDragOver(event, folder._id)}
          onDragLeave={(event) => onFolderDragLeave(event, folder._id)}
          onDrop={(event) => onFolderDrop(event, folder._id)}
        >
          {isEmpty ? (
            <li>
              <div
                className={`space-y-3 px-4 py-4 transition ${
                  isDropTarget
                    ? "bg-amber-50 ring-2 ring-inset ring-amber-400 dark:bg-amber-950/30 dark:ring-amber-500"
                    : "bg-zinc-50/80 dark:bg-zinc-900/40"
                }`}
                style={{ paddingLeft: `${1 + (depth + 1) * 1.25}rem` }}
                onDragOver={(event) => onFolderDragOver(event, folder._id)}
                onDragLeave={(event) => onFolderDragLeave(event, folder._id)}
                onDrop={(event) => onFolderDrop(event, folder._id)}
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isDropTarget
                    ? "Release to move the note here."
                    : "This folder is empty."}
                </p>
                {!isDropTarget ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateFolder(folder._id)}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-950"
                    >
                      <FolderPlusIcon className="size-4" aria-hidden />
                      New Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreateNote(folder._id)}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-950"
                    >
                      <DocumentPlusIcon className="size-4" aria-hidden />
                      Add Note
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          ) : (
            <>
              {childFolders.map((childFolder) => (
                <FolderTreeNode
                  key={childFolder._id}
                  projectId={projectId}
                  folder={childFolder}
                  allFolders={allFolders}
                  allNotes={allNotes}
                  depth={depth + 1}
                  expandedFolderIds={expandedFolderIds}
                  draggedNoteId={draggedNoteId}
                  dropTargetFolderId={dropTargetFolderId}
                  onToggle={onToggle}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateFolder={onCreateFolder}
                  onCreateNote={onCreateNote}
                  onMoveNote={onMoveNote}
                  onDeleteNote={onDeleteNote}
                  onNoteDragStart={onNoteDragStart}
                  onNoteDragEnd={onNoteDragEnd}
                  onFolderDragOver={onFolderDragOver}
                  onFolderDragLeave={onFolderDragLeave}
                  onFolderDrop={onFolderDrop}
                />
              ))}
              {childNotes.map((note) => (
                <NoteRow
                  key={note._id}
                  projectId={projectId}
                  note={note}
                  depth={depth + 1}
                  isDragging={draggedNoteId === note._id}
                  containingFolderId={folder._id}
                  draggedNoteId={draggedNoteId}
                  onMove={() => onMoveNote(note)}
                  onDelete={() => onDeleteNote(note)}
                  onDragStart={onNoteDragStart}
                  onDragEnd={onNoteDragEnd}
                  onFolderDragOver={onFolderDragOver}
                  onFolderDragLeave={onFolderDragLeave}
                  onFolderDrop={onFolderDrop}
                />
              ))}
            </>
          )}
        </ul>
      ) : null}
    </li>
  );
}

type NoteRowProps = {
  projectId: string;
  note: NoteResponse;
  depth: number;
  isDragging: boolean;
  containingFolderId?: string;
  draggedNoteId?: string | null;
  onMove: () => void;
  onDelete: () => void;
  onDragStart: (event: DragEvent<HTMLLIElement>, noteId: string) => void;
  onDragEnd: () => void;
  onFolderDragOver?: (event: DragEvent<HTMLElement>, folderId: string) => void;
  onFolderDragLeave?: (event: DragEvent<HTMLElement>, folderId: string) => void;
  onFolderDrop?: (event: DragEvent<HTMLElement>, folderId: string) => void;
};

function NoteRow({
  projectId,
  note,
  depth,
  isDragging,
  containingFolderId,
  draggedNoteId,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}: Readonly<NoteRowProps>) {
  const name = note.title.trim() || "Untitled note";
  const canAcceptFolderDrop =
    Boolean(containingFolderId) &&
    Boolean(draggedNoteId) &&
    draggedNoteId !== note._id;

  return (
    <li
      draggable
      onDragStart={(event) => onDragStart(event, note._id)}
      onDragEnd={onDragEnd}
      onDragOver={
        canAcceptFolderDrop && containingFolderId && onFolderDragOver
          ? (event) => onFolderDragOver(event, containingFolderId)
          : undefined
      }
      onDragLeave={
        canAcceptFolderDrop && containingFolderId && onFolderDragLeave
          ? (event) => onFolderDragLeave(event, containingFolderId)
          : undefined
      }
      onDrop={
        canAcceptFolderDrop && containingFolderId && onFolderDrop
          ? (event) => onFolderDrop(event, containingFolderId)
          : undefined
      }
      className={isDragging ? "opacity-50" : undefined}
    >
      <BrowserRow depth={depth}>
        <Link
          href={getNoteDetailPath(projectId, note._id)}
          draggable={false}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-2 active:cursor-grabbing"
        >
          <span className="size-4 shrink-0" aria-hidden />
          <DocumentTextIcon
            className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400"
            aria-hidden
          />
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
        </Link>

        <div className="flex justify-end">
          <ItemActionsMenu
            actions={[
              {
                key: "move",
                label: "Move",
                icon: <FolderIcon className="size-4" aria-hidden />,
                onClick: onMove,
              },
              deleteItemAction("Delete note", onDelete),
            ]}
            menuLabel={`Actions for ${name}`}
          />
        </div>
      </BrowserRow>
    </li>
  );
}

type BrowserRowProps = {
  depth: number;
  children: ReactNode;
  isDropTarget?: boolean;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
};

function BrowserRow({
  depth,
  children,
  isDropTarget = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: Readonly<BrowserRowProps>) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 pr-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
        isDropTarget
          ? "bg-amber-50 ring-2 ring-inset ring-amber-400 dark:bg-amber-950/30 dark:ring-amber-500"
          : "bg-white dark:bg-zinc-950"
      }`}
      style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}
