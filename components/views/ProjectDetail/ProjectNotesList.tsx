"use client";

import type { NoteResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ProjectNotesListProps {
  notes: NoteResponse[];
}

export default function ProjectNotesList({
  notes,
}: Readonly<ProjectNotesListProps>) {
  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li
          key={note._id}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
            {note.content}
          </p>
          <time
            dateTime={note.createdAt}
            className="mt-3 block text-xs text-zinc-500"
          >
            {formatDisplayDate(note.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
