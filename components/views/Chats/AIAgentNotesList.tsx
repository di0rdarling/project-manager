"use client";

import { useState, type ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { TruncatedRichTextContent } from "@/components/ui/inputs/richText/TruncatedRichTextContent";
import type { AgentNoteResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ItemModalRenderProps {
  open: boolean;
  item: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface AIAgentNotesListProps {
  notes: AgentNoteResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

export default function AIAgentNotesList({
  notes,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<AIAgentNotesListProps>) {
  const [noteToEdit, setNoteToEdit] = useState<AgentNoteResponse | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<AgentNoteResponse | null>(
    null,
  );

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
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    {note.title}
                  </h3>
                ) : null}
                <TruncatedRichTextContent
                  content={note.content}
                  className="text-sm text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <time
                  dateTime={note.createdAt}
                  className="pt-2 text-xs text-zinc-500"
                >
                  {formatDisplayDate(note.createdAt)}
                </time>
                <IconButton
                  type="button"
                  aria-label="Edit note"
                  onClick={() => setNoteToEdit(note)}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  aria-label="Delete note"
                  onClick={() => setNoteToDelete(note)}
                >
                  <TrashIcon className="size-4 text-red-500" />
                </IconButton>
              </div>
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
