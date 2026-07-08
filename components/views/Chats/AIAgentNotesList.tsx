"use client";

import { useState, type ReactNode } from "react";
import {
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { TruncatedRichTextContent } from "@/components/ui/inputs/richText/TruncatedRichTextContent";
import { isAgentNoteOwner } from "@/lib/agent-notes";
import {
  getChatTeammate,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import type { AgentNoteResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ItemModalRenderProps {
  open: boolean;
  item: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface AIAgentNotesListProps {
  teammateId: ChatTeammateId;
  notes: AgentNoteResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onShareSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
  renderShareModal: (props: ItemModalRenderProps) => ReactNode;
}

function formatSharedWithLabel(
  sharedWithTeammateIds: ChatTeammateId[],
): string {
  if (sharedWithTeammateIds.length === 0) {
    return "";
  }

  const names = sharedWithTeammateIds.map(
    (id) => getChatTeammate(id).name,
  );

  if (names.length === 1) {
    return `Shared with ${names[0]}`;
  }

  if (names.length === 2) {
    return `Shared with ${names[0]} and ${names[1]}`;
  }

  return `Shared with ${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export default function AIAgentNotesList({
  teammateId,
  notes,
  onEditSuccess,
  onDeleteSuccess,
  onShareSuccess,
  renderEditModal,
  renderDeleteModal,
  renderShareModal,
}: Readonly<AIAgentNotesListProps>) {
  const [noteToEdit, setNoteToEdit] = useState<AgentNoteResponse | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<AgentNoteResponse | null>(
    null,
  );
  const [noteToShare, setNoteToShare] = useState<AgentNoteResponse | null>(
    null,
  );

  return (
    <>
      <ul className="space-y-3">
        {notes.map((note) => {
          const isOwner = isAgentNoteOwner(note, teammateId);
          const currentAgentName = getChatTeammate(teammateId).name;
          const sharedWithLabel = isOwner
            ? formatSharedWithLabel(note.sharedWithTeammateIds)
            : `Shared with ${currentAgentName}`;
          return (
            <li
              key={note._id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="space-y-1">
                    {note.title ? (
                      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                        {note.title}
                      </h3>
                    ) : null}
                    {sharedWithLabel ? (
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {sharedWithLabel}
                      </p>
                    ) : null}
                  </div>
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
                  {isOwner ? (
                    <>
                      <IconButton
                        type="button"
                        aria-label="Share note"
                        onClick={() => setNoteToShare(note)}
                      >
                        <ShareIcon className="size-4" />
                      </IconButton>
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
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
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

      {renderShareModal({
        open: noteToShare !== null,
        item: noteToShare,
        onClose: () => setNoteToShare(null),
        onSuccess: () => {
          setNoteToShare(null);
          onShareSuccess?.();
        },
      })}
    </>
  );
}
