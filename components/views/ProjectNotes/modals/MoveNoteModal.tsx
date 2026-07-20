"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/inputs/Select";
import { useMoveNote } from "@/hooks/mutations/notes/useMoveNote";
import { buildFolderOptions } from "@/lib/note-folders";
import type { NoteFolderResponse, NoteResponse } from "@/lib/types";

const ROOT_VALUE = "";

type MoveNoteModalProps = {
  open: boolean;
  projectId: string;
  note: NoteResponse | null;
  folders: NoteFolderResponse[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function MoveNoteModal({
  open,
  projectId,
  note,
  folders,
  onClose,
  onSuccess,
}: Readonly<MoveNoteModalProps>) {
  const [folderId, setFolderId] = useState(ROOT_VALUE);

  useEffect(() => {
    if (note) {
      setFolderId(note.folderId ?? ROOT_VALUE);
    }
  }, [note]);

  const folderOptions = useMemo(
    () => [
      { value: ROOT_VALUE, label: "No folder (root)" },
      ...buildFolderOptions(folders),
    ],
    [folders],
  );

  const moveNoteMutation = useMoveNote({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note) {
      return;
    }

    moveNoteMutation.mutate({
      projectId,
      noteId: note._id,
      folderId: folderId || null,
    });
  }

  function handleClose() {
    if (moveNoteMutation.isPending) {
      return;
    }

    moveNoteMutation.reset();
    onClose();
  }

  const formError =
    moveNoteMutation.error instanceof Error
      ? moveNoteMutation.error.message
      : null;

  if (!open || !note) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Move note" size="narrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Move{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            &ldquo;{note.title.trim() || "Untitled note"}&rdquo;
          </span>{" "}
          to another folder.
        </p>

        <Select
          id="move-note-folder"
          label="Folder"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          options={folderOptions}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={moveNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={moveNoteMutation.isPending}>
            {moveNoteMutation.isPending ? "Moving..." : "Move note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
