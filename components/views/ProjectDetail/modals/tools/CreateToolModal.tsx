"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateTool } from "@/hooks/mutations/tools/useCreateTool";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateToolModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateToolModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreateToolModalProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createToolMutation = useCreateTool({
    onSuccess: () => {
      setName("");
      setContent("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setValidationError("Tool name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Tool content is required");
      return;
    }

    setValidationError(null);
    createToolMutation.mutate({ projectId, name: name.trim(), content });
  }

  function handleClose() {
    if (createToolMutation.isPending) {
      return;
    }

    setName("");
    setContent("");
    setValidationError(null);
    createToolMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createToolMutation.error instanceof Error
      ? createToolMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Tool">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a name for this tool"
          autoFocus
        />

        <RichTextEditor
          key="create-tool"
          id="content"
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
            disabled={createToolMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createToolMutation.isPending}>
            {createToolMutation.isPending ? "Adding..." : "Add tool"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
