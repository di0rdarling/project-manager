"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { useCreateNoteFolder } from "@/hooks/mutations/noteFolders/useCreateNoteFolder";

type CreateFolderModalProps = {
  open: boolean;
  projectId: string;
  featureId?: string;
  parentFolderId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateFolderModal({
  open,
  projectId,
  featureId,
  parentFolderId = null,
  onClose,
  onSuccess,
}: Readonly<CreateFolderModalProps>) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createFolderMutation = useCreateNoteFolder({
    onSuccess: () => {
      setName("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setValidationError("Folder name is required");
      return;
    }

    setValidationError(null);
    createFolderMutation.mutate({
      projectId,
      name: name.trim(),
      featureId: featureId ?? null,
      parentFolderId,
    });
  }

  function handleClose() {
    if (createFolderMutation.isPending) {
      return;
    }

    setName("");
    setValidationError(null);
    createFolderMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createFolderMutation.error instanceof Error
      ? createFolderMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New folder" size="narrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="folder-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a folder name"
          autoFocus
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createFolderMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createFolderMutation.isPending}>
            {createFolderMutation.isPending ? "Creating..." : "Create folder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
