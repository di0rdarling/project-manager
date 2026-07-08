"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteDomainKnowledge } from "@/hooks/mutations/domainKnowledge/useDeleteDomainKnowledge";
import type { DomainKnowledgeResponse } from "@/lib/types";

type DeleteDomainKnowledgeModalProps = {
  open: boolean;
  projectId: string;
  domainKnowledge: DomainKnowledgeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteDomainKnowledgeModal({
  open,
  projectId,
  domainKnowledge,
  onClose,
  onSuccess,
}: DeleteDomainKnowledgeModalProps) {
  const deleteDomainKnowledgeMutation = useDeleteDomainKnowledge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!domainKnowledge) {
      return;
    }

    deleteDomainKnowledgeMutation.mutate({
      projectId,
      domainKnowledgeId: domainKnowledge._id,
      featureId: domainKnowledge.featureId,
    });
  }

  function handleClose() {
    if (deleteDomainKnowledgeMutation.isPending) {
      return;
    }

    deleteDomainKnowledgeMutation.reset();
    onClose();
  }

  const formError =
    deleteDomainKnowledgeMutation.error instanceof Error
      ? deleteDomainKnowledgeMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete domain knowledge" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this domain knowledge item
        {domainKnowledge ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;{domainKnowledge.name.trim()}&rdquo;
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
          disabled={deleteDomainKnowledgeMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteDomainKnowledgeMutation.isPending}
        >
          {deleteDomainKnowledgeMutation.isPending
            ? "Deleting..."
            : "Delete domain knowledge"}
        </Button>
      </div>
    </Modal>
  );
}
