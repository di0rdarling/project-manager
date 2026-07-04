"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateCoreUser } from "@/hooks/mutations/coreUsers/useUpdateCoreUser";
import type { CoreUserResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditCoreUserModalProps = {
  open: boolean;
  projectId: string;
  coreUser: CoreUserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditCoreUserModal({
  open,
  projectId,
  coreUser,
  onClose,
  onSuccess,
}: EditCoreUserModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (coreUser) {
      setName(coreUser.name);
      setRole(coreUser.role);
      setContent(coreUser.content);
      setValidationError(null);
    }
  }, [coreUser]);

  const updateCoreUserMutation = useUpdateCoreUser({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!coreUser) {
      return;
    }

    if (!name.trim()) {
      setValidationError("Name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("User description is required");
      return;
    }

    setValidationError(null);
    updateCoreUserMutation.mutate({
      projectId,
      coreUserId: coreUser._id,
      name: name.trim(),
      role: role.trim(),
      content,
    });
  }

  function handleClose() {
    if (updateCoreUserMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateCoreUserMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateCoreUserMutation.error instanceof Error
      ? updateCoreUserMutation.error.message
      : null);

  if (!open || !coreUser) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit core user">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-core-user-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter the user's name or persona label"
          autoFocus
        />

        <Input
          id="edit-core-user-role"
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="e.g. Project Manager, End User, Stakeholder"
        />

        <RichTextEditor
          key={coreUser._id}
          id="edit-core-user-content"
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
            disabled={updateCoreUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateCoreUserMutation.isPending}>
            {updateCoreUserMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
