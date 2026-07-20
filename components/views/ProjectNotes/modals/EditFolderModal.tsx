"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { useUpdateNoteFolder } from "@/hooks/mutations/noteFolders/useUpdateNoteFolder";
import {
  buildFolderOptions,
  getDescendantFolderIds,
} from "@/lib/note-folders";
import type { NoteFolderResponse } from "@/lib/types";

const ROOT_VALUE = "";

type EditFolderModalProps = {
  open: boolean;
  projectId: string;
  folder: NoteFolderResponse | null;
  folders: NoteFolderResponse[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditFolderModal({
  open,
  projectId,
  folder,
  folders,
  onClose,
  onSuccess,
}: Readonly<EditFolderModalProps>) {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState(ROOT_VALUE);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setParentFolderId(folder.parentFolderId ?? ROOT_VALUE);
      setValidationError(null);
    }
  }, [folder]);

  const parentOptions = useMemo(() => {
    if (!folder) {
      return [];
    }

    const excludeIds = getDescendantFolderIds(folders, folder._id);
    excludeIds.add(folder._id);

    return [
      { value: ROOT_VALUE, label: "No folder (root)" },
      ...buildFolderOptions(folders, { excludeIds }),
    ];
  }, [folder, folders]);

  const updateFolderMutation = useUpdateNoteFolder({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!folder) {
      return;
    }

    if (!name.trim()) {
      setValidationError("Folder name is required");
      return;
    }

    setValidationError(null);
    updateFolderMutation.mutate({
      projectId,
      folderId: folder._id,
      name: name.trim(),
      parentFolderId: parentFolderId || null,
    });
  }

  function handleClose() {
    if (updateFolderMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateFolderMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateFolderMutation.error instanceof Error
      ? updateFolderMutation.error.message
      : null);

  if (!open || !folder) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit folder" size="narrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-folder-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a folder name"
          autoFocus
        />

        <Select
          id="edit-folder-parent"
          label="Parent folder"
          value={parentFolderId}
          onChange={(event) => setParentFolderId(event.target.value)}
          options={parentOptions}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateFolderMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateFolderMutation.isPending}>
            {updateFolderMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
