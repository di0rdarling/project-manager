"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import type { NoteResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";
import DeleteNoteModal from "./DeleteNoteModal";
import EditNoteModal from "./EditNoteModal";

interface ProjectNotesListProps {
  projectId: string;
  notes: NoteResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export default function ProjectNotesList({
  projectId,
  notes,
  onEditSuccess,
  onDeleteSuccess,
}: Readonly<ProjectNotesListProps>) {
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
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    {note.title}
                  </h3>
                ) : null}
                <RichTextContent
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

      <EditNoteModal
        open={noteToEdit !== null}
        projectId={projectId}
        note={noteToEdit}
        onClose={() => setNoteToEdit(null)}
        onSuccess={() => onEditSuccess?.()}
      />

      <DeleteNoteModal
        open={noteToDelete !== null}
        projectId={projectId}
        note={noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onSuccess={() => onDeleteSuccess?.()}
      />
    </>
  );
}
