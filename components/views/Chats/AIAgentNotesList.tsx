"use client";

import { useState, type ReactNode } from "react";
import { ShareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { NotesTable } from "@/components/ui/tables/NotesTable";
import {
  formatAgentNoteSharedWithNames,
  getAgentNoteDetailPath,
  isAgentNoteOwner,
} from "@/lib/agents/agent-notes";
import {
  getChatTeammate,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  appendAgentProfileFrom,
  type AgentProfileFrom,
} from "@/lib/chats/agent-profile-navigation";
import type { AgentNoteResponse } from "@/lib/types";

interface ItemModalRenderProps {
  open: boolean;
  item: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface AIAgentNotesListProps {
  teammateId: ChatTeammateId;
  notes: AgentNoteResponse[];
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
  onDeleteSuccess?: () => void;
  onShareSuccess?: () => void;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
  renderShareModal: (props: ItemModalRenderProps) => ReactNode;
}

function formatSharedWithLabel(
  sharedWithTeammateIds: ChatTeammateId[],
): string {
  return formatAgentNoteSharedWithNames(sharedWithTeammateIds) ?? "Private";
}

function getSharedWithSortValue(
  note: AgentNoteResponse,
  teammateId: ChatTeammateId,
): string {
  const isOwner = isAgentNoteOwner(note, teammateId);

  if (!isOwner) {
    return getChatTeammate(teammateId).name.toLocaleLowerCase();
  }

  return formatSharedWithLabel(note.sharedWithTeammateIds).toLocaleLowerCase();
}

export default function AIAgentNotesList({
  teammateId,
  notes,
  profileFrom,
  profileProjectId,
  onDeleteSuccess,
  onShareSuccess,
  renderDeleteModal,
  renderShareModal,
}: Readonly<AIAgentNotesListProps>) {
  const [noteToDelete, setNoteToDelete] = useState<AgentNoteResponse | null>(
    null,
  );
  const [noteToShare, setNoteToShare] = useState<AgentNoteResponse | null>(
    null,
  );
  const currentAgentName = getChatTeammate(teammateId).name;

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
            key: "shared",
            header: "Shared with",
            cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
            render: (note) => {
              const isOwner = isAgentNoteOwner(note, teammateId);
              return isOwner
                ? formatSharedWithLabel(note.sharedWithTeammateIds)
                : currentAgentName;
            },
            getSortValue: (note) => getSharedWithSortValue(note, teammateId),
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
        getItemHref={(note) =>
          appendAgentProfileFrom(
            getAgentNoteDetailPath(teammateId, note._id),
            profileFrom ?? null,
            profileProjectId,
          )
        }
        getItemLabel={(note) => note.title || "note"}
        rowActions={[
          {
            key: "share",
            label: "Share",
            icon: <ShareIcon className="size-4" aria-hidden />,
            onClick: (note) => setNoteToShare(note),
          },
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
