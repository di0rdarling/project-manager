"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteTool } from "@/hooks/mutations/tools/useDeleteTool";
import type { ToolResponse } from "@/lib/types";
import { getRichTextPreview } from "@/lib/rich-text";

type DeleteToolModalProps = {
  open: boolean;
  projectId: string;
  tool: ToolResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteToolModal({
  open,
  projectId,
  tool,
  onClose,
  onSuccess,
}: DeleteToolModalProps) {
  const deleteToolMutation = useDeleteTool({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!tool) {
      return;
    }

    deleteToolMutation.mutate({ projectId, toolId: tool._id });
  }

  function handleClose() {
    if (deleteToolMutation.isPending) {
      return;
    }

    deleteToolMutation.reset();
    onClose();
  }

  const formError =
    deleteToolMutation.error instanceof Error
      ? deleteToolMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete tool">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this tool
        {tool ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {tool.name.trim() || getRichTextPreview(tool.content)}
              &rdquo;
            </span>
          </>
        ) : null}
        ? This action cannot be undone.
      </p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={deleteToolMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteToolMutation.isPending}
        >
          {deleteToolMutation.isPending ? "Deleting..." : "Delete tool"}
        </Button>
      </div>
    </Modal>
  );
}
