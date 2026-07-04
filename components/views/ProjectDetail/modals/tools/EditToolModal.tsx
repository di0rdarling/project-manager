"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateTool } from "@/hooks/mutations/useUpdateTool";
import type { ToolResponse } from "@/lib/types";
import { isRichTextEmpty } from "@/lib/rich-text";

type EditToolModalProps = {
  open: boolean;
  projectId: string;
  tool: ToolResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditToolModal({
  open,
  projectId,
  tool,
  onClose,
  onSuccess,
}: EditToolModalProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setContent(tool.content);
      setValidationError(null);
    }
  }, [tool]);

  const updateToolMutation = useUpdateTool({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tool) {
      return;
    }

    if (!name.trim()) {
      setValidationError("Tool name is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Tool content is required");
      return;
    }

    setValidationError(null);
    updateToolMutation.mutate({
      projectId,
      toolId: tool._id,
      name: name.trim(),
      content,
    });
  }

  function handleClose() {
    if (updateToolMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateToolMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateToolMutation.error instanceof Error
      ? updateToolMutation.error.message
      : null);

  if (!open || !tool) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit tool">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a name for this tool"
          autoFocus
        />

        <RichTextEditor
          key={tool._id}
          id="edit-content"
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
            disabled={updateToolMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateToolMutation.isPending}>
            {updateToolMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
