"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateCoreUser } from "@/hooks/mutations/coreUsers/useCreateCoreUser";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateCoreUserModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCoreUserModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreateCoreUserModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createCoreUserMutation = useCreateCoreUser({
    onSuccess: () => {
      setName("");
      setRole("");
      setContent("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setValidationError("Name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("User description is required");
      return;
    }

    setValidationError(null);
    createCoreUserMutation.mutate({
      projectId,
      name: name.trim(),
      role: role.trim(),
      content,
    });
  }

  function handleClose() {
    if (createCoreUserMutation.isPending) {
      return;
    }

    setName("");
    setRole("");
    setContent("");
    setValidationError(null);
    createCoreUserMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createCoreUserMutation.error instanceof Error
      ? createCoreUserMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Core User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="core-user-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter the user's name or persona label"
          autoFocus
        />

        <Input
          id="core-user-role"
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="e.g. Project Manager, End User, Stakeholder"
        />

        <RichTextEditor
          key="create-core-user"
          id="core-user-content"
          label="Description"
          value={content}
          onChange={setContent}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createCoreUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createCoreUserMutation.isPending}>
            {createCoreUserMutation.isPending ? "Adding..." : "Add core user"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
