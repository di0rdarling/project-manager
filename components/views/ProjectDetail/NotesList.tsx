"use client";

import { useState, type ReactNode } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
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
  onDeleteSuccess?: () => void;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

export default function NotesList({
  projectId,
  notes,
  onDeleteSuccess,
  renderDeleteModal,
}: Readonly<NotesListProps>) {
  const [noteToDelete, setNoteToDelete] = useState<NoteResponse | null>(null);

  return (
    <>
      <NotesTable
        items={notes}
        columns={[
          {
            key: "title",
            header: "Title",
            cellClassName:
              "px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100",
            render: (note) => note.title || "Untitled note",
          },
          {
            key: "date",
            header: "Created",
            cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
            render: (note) => <ListItemDate dateTime={note.createdAt} />,
          },
        ]}
        getItemHref={(note) => getNoteDetailPath(projectId, note._id)}
        getItemLabel={(note) => note.title || "note"}
        rowActions={[
          {
            key: "delete",
            label: "Delete",
            icon: <TrashIcon className="size-4" aria-hidden />,
            variant: "danger",
            onClick: (note) => setNoteToDelete(note),
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
    </>
  );
}
