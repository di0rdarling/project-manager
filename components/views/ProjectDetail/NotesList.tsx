"use client";

import { useState, type ReactNode } from "react";
import {
  deleteItemAction,
  editItemAction,
  expandItemAction,
  ItemActionsMenu,
} from "@/components/ui/ItemActionsMenu";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { TruncatedRichTextContent } from "@/components/ui/inputs/richText/TruncatedRichTextContent";
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
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

export default function NotesList({
  projectId,
  notes,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<NotesListProps>) {
  const [noteToEdit, setNoteToEdit] = useState<NoteResponse | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                {note.title ? (
                  <div className="space-y-1">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      {note.title}
                    </h3>
                    <ListItemDate dateTime={note.createdAt} />
                  </div>
                ) : (
                  <ListItemDate dateTime={note.createdAt} />
                )}
                <TruncatedRichTextContent
                  content={note.content}
                  className="text-sm text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <ItemActionsMenu
                actions={[
                  expandItemAction(
                    "Expand note",
                    getNoteDetailPath(projectId, note._id),
                  ),
                  editItemAction("Edit note", () => setNoteToEdit(note)),
                  deleteItemAction("Delete note", () => setNoteToDelete(note)),
                ]}
              />
            </div>
          </li>
        ))}
      </ul>

      {renderEditModal({
        open: noteToEdit !== null,
        item: noteToEdit,
        onClose: () => setNoteToEdit(null),
        onSuccess: () => {
          setNoteToEdit(null);
          onEditSuccess?.();
        },
      })}

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
