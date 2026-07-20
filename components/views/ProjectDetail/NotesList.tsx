"use client";

import { useState, type ReactNode } from "react";
import { FolderIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { NotesTable } from "@/components/ui/tables/NotesTable";
import { getNoteDetailPath } from "@/lib/notes";
import type { NoteResponse } from "@/lib/types";

interface ItemModalRenderProps {
  open: boolean;
  item: NoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface NotesListProps {
  projectId: string;
  notes: NoteResponse[];
  showMoveAction?: boolean;
  onDeleteSuccess?: () => void;
  onMoveSuccess?: () => void;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
  renderMoveModal?: (props: ItemModalRenderProps) => ReactNode;
}

export default function NotesList({
  projectId,
  notes,
  showMoveAction = false,
  onDeleteSuccess,
  onMoveSuccess,
  renderDeleteModal,
  renderMoveModal,
}: Readonly<NotesListProps>) {
  const [noteToDelete, setNoteToDelete] = useState<NoteResponse | null>(null);
  const [noteToMove, setNoteToMove] = useState<NoteResponse | null>(null);

  return (
    <>
      <NotesTable
        items={notes}
        defaultSort={{ columnKey: "createdAt", direction: "desc" }}
        columns={[
          {
            key: "title",
            header: "Title",
            cellClassName:
              "px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100",
            render: (note) => note.title || "Untitled note",
            getSortValue: (note) =>
              (note.title || "Untitled note").toLocaleLowerCase(),
          },
          {
            key: "createdAt",
            header: "Created",
            cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
            render: (note) => <ListItemDate dateTime={note.createdAt} />,
            getSortValue: (note) => note.createdAt,
          },
          {
            key: "updatedAt",
            header: "Updated",
            cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
            render: (note) => <ListItemDate dateTime={note.updatedAt} />,
            getSortValue: (note) => note.updatedAt,
          },
        ]}
        getItemHref={(note) => getNoteDetailPath(projectId, note._id)}
        getItemLabel={(note) => note.title || "note"}
        rowActions={[
          ...(showMoveAction
            ? [
                {
                  key: "move",
                  label: "Move",
                  icon: <FolderIcon className="size-4" aria-hidden />,
                  onClick: (note: NoteResponse) => setNoteToMove(note),
                },
              ]
            : []),
          {
            key: "delete",
            label: "Delete",
            icon: <TrashIcon className="size-4" aria-hidden />,
            variant: "danger" as const,
            onClick: (note: NoteResponse) => setNoteToDelete(note),
          },
        ]}
      />

      {renderDeleteModal({
        open: noteToDelete !== null,
        item: noteToDelete,
        onClose: () => setNoteToDelete(null),
        onSuccess: () => {
          setNoteToDelete(null);
          onDeleteSuccess?.();
        },
      })}

      {showMoveAction && renderMoveModal
        ? renderMoveModal({
            open: noteToMove !== null,
            item: noteToMove,
            onClose: () => setNoteToMove(null),
            onSuccess: () => {
              setNoteToMove(null);
              onMoveSuccess?.();
            },
          })
        : null}
    </>
  );
}
