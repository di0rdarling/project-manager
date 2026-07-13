"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useShareAgentNote } from "@/hooks/mutations/agent-notes/useShareAgentNote";
import {
  CHAT_TEAMMATES,
  getChatTeammate,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import type { AgentNoteResponse } from "@/lib/types";

type ShareAgentNoteModalProps = {
  open: boolean;
  teammateId: ChatTeammateId;
  note: AgentNoteResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ShareAgentNoteModal({
  open,
  teammateId,
  note,
  onClose,
  onSuccess,
}: ShareAgentNoteModalProps) {
  const [selectedTeammateIds, setSelectedTeammateIds] = useState<
    ChatTeammateId[]
  >([]);

  useEffect(() => {
    if (note) {
      setSelectedTeammateIds(note.sharedWithTeammateIds);
    }
  }, [note]);

  const shareAgentNoteMutation = useShareAgentNote({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const shareableTeammates = CHAT_TEAMMATES.filter(
    (teammate) => teammate.id !== teammateId,
  );

  function toggleTeammate(id: ChatTeammateId) {
    setSelectedTeammateIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note) {
      return;
    }

    shareAgentNoteMutation.mutate({
      teammateId,
      noteId: note._id,
      sharedWithTeammateIds: selectedTeammateIds,
      previousSharedWithTeammateIds: note.sharedWithTeammateIds,
    });
  }

  function handleClose() {
    if (shareAgentNoteMutation.isPending) {
      return;
    }

    shareAgentNoteMutation.reset();
    onClose();
  }

  const formError =
    shareAgentNoteMutation.error instanceof Error
      ? shareAgentNoteMutation.error.message
      : null;

  if (!open || !note) {
    return null;
  }

  const ownerName = getChatTeammate(teammateId).name;

  return (
    <Modal open={open} onClose={handleClose} title="Share note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose which AI teammates can also see{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            &ldquo;{note.title.trim() || "this note"}&rdquo;
          </span>
          . Shared notes appear on their profile pages and are included in their
          conversations. Only {ownerName} and the teammates you select will have
          access.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium">Share with</p>
          <ul className="space-y-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
            {shareableTeammates.map((teammate) => {
              const isSelected = selectedTeammateIds.includes(teammate.id);

              return (
                <li key={teammate.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTeammate(teammate.id)}
                      className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <Avatar
                      initials={teammate.avatarInitials}
                      src={teammate.avatarImageSrc}
                      alt={teammate.name}
                      colorClassName={teammate.avatarColorClassName}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {teammate.name}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {teammate.role}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={shareAgentNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={shareAgentNoteMutation.isPending}>
            {shareAgentNoteMutation.isPending ? "Saving..." : "Save sharing"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
