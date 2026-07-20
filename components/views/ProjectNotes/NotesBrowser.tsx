"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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
import { ListItemDate } from "@/components/ui/ListItemDate";
import DeleteNoteModal from "@/components/views/ProjectDetail/modals/notes/DeleteNoteModal";
import MoveNoteModal from "@/components/views/ProjectNotes/modals/MoveNoteModal";
import { getChildFolders } from "@/lib/note-folders";
import { getNoteDetailPath } from "@/lib/notes";
import type { NoteFolderResponse, NoteResponse } from "@/lib/types";

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
  const [noteToDelete, setNoteToDelete] = useState<NoteResponse | null>(null);
  const [noteToMove, setNoteToMove] = useState<NoteResponse | null>(null);

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

  if (rootFolders.length === 0 && rootNotes.length === 0) {
    return null;
  }

  return (
    <>
      <div
        aria-label="Notes and folders"
        className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
      >
        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_auto] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 sm:grid">
          <div>Name</div>
          <div className="text-right">Updated</div>
          <div className="min-w-16 text-right">
            <span className="sr-only">Actions</span>
          </div>
        </div>

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
              onToggle={toggleFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={expandAndCreateFolder}
              onCreateNote={expandAndCreateNote}
              onMoveNote={setNoteToMove}
              onDeleteNote={setNoteToDelete}
            />
          ))}

          {rootNotes.map((note) => (
            <NoteRow
              key={note._id}
              projectId={projectId}
              note={note}
              depth={0}
              onMove={() => setNoteToMove(note)}
              onDelete={() => setNoteToDelete(note)}
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
  onToggle: (folderId: string) => void;
  onEditFolder: (folder: NoteFolderResponse) => void;
  onDeleteFolder: (folder: NoteFolderResponse) => void;
  onCreateFolder: (parentFolderId: string) => void;
  onCreateNote: (folderId: string) => void;
  onMoveNote: (note: NoteResponse) => void;
  onDeleteNote: (note: NoteResponse) => void;
};

function FolderTreeNode({
  projectId,
  folder,
  allFolders,
  allNotes,
  depth,
  expandedFolderIds,
  onToggle,
  onEditFolder,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onMoveNote,
  onDeleteNote,
}: Readonly<FolderTreeNodeProps>) {
  const isExpanded = expandedFolderIds.has(folder._id);
  const childFolders = getChildFolders(allFolders, folder._id);
  const childNotes = notesInFolder(allNotes, folder._id);
  const childCount = childFolders.length + childNotes.length;
  const isEmpty = childCount === 0;

  return (
    <li>
      <BrowserRow depth={depth}>
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
            className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {folder.name}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400 sm:hidden">
              {childCount} {childCount === 1 ? "item" : "items"}
            </span>
          </span>
          <span className="hidden shrink-0 text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
            {childCount} {childCount === 1 ? "item" : "items"}
          </span>
        </button>

        <div className="hidden sm:block" aria-hidden />

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
        <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {isEmpty ? (
            <li>
              <div
                className="space-y-3 bg-zinc-50/80 px-4 py-4 dark:bg-zinc-900/40"
                style={{ paddingLeft: `${1 + (depth + 1) * 1.25}rem` }}
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  This folder is empty.
                </p>
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
                  onToggle={onToggle}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateFolder={onCreateFolder}
                  onCreateNote={onCreateNote}
                  onMoveNote={onMoveNote}
                  onDeleteNote={onDeleteNote}
                />
              ))}
              {childNotes.map((note) => (
                <NoteRow
                  key={note._id}
                  projectId={projectId}
                  note={note}
                  depth={depth + 1}
                  onMove={() => onMoveNote(note)}
                  onDelete={() => onDeleteNote(note)}
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
  onMove: () => void;
  onDelete: () => void;
};

function NoteRow({
  projectId,
  note,
  depth,
  onMove,
  onDelete,
}: Readonly<NoteRowProps>) {
  const name = note.title.trim() || "Untitled note";

  return (
    <li>
      <BrowserRow depth={depth}>
        <Link
          href={getNoteDetailPath(projectId, note._id)}
          className="flex min-w-0 flex-1 items-center gap-2"
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

        <div className="hidden text-right sm:block">
          <ListItemDate dateTime={note.updatedAt} />
        </div>

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

function BrowserRow({
  depth,
  children,
}: Readonly<{ depth: number; children: ReactNode }>) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-white py-3 pr-4 transition hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
      style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
    >
      {children}
    </div>
  );
}
