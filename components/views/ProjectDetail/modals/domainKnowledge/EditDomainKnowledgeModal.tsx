"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateDomainKnowledge } from "@/hooks/mutations/domainKnowledge/useUpdateDomainKnowledge";
import {
  DOMAIN_KNOWLEDGE_CONFIDENCE_OPTIONS,
  parseConfidenceLevel,
} from "@/lib/domain-knowledge";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { DomainKnowledgeResponse } from "@/lib/types";

type EditDomainKnowledgeModalProps = {
  open: boolean;
  projectId: string;
  domainKnowledge: DomainKnowledgeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditDomainKnowledgeModal({
  open,
  projectId,
  domainKnowledge,
  onClose,
  onSuccess,
}: EditDomainKnowledgeModalProps) {
  const [name, setName] = useState("");
  const [currentUnderstanding, setCurrentUnderstanding] = useState("");
  const [openQuestions, setOpenQuestions] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (domainKnowledge) {
      setName(domainKnowledge.name);
      setCurrentUnderstanding(domainKnowledge.currentUnderstanding);
      setOpenQuestions(domainKnowledge.openQuestions);
      setConfidenceLevel(domainKnowledge.confidenceLevel ?? "");
      setValidationError(null);
    }
  }, [domainKnowledge]);

  const updateDomainKnowledgeMutation = useUpdateDomainKnowledge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!domainKnowledge) {
      return;
    }

    if (!name.trim()) {
      setValidationError("Term or concept name is required");
      return;
    }

    if (isRichTextEmpty(currentUnderstanding)) {
      setValidationError("Current understanding is required");
      return;
    }

    setValidationError(null);
    updateDomainKnowledgeMutation.mutate({
      projectId,
      domainKnowledgeId: domainKnowledge._id,
      name: name.trim(),
      currentUnderstanding,
      openQuestions,
      confidenceLevel: parseConfidenceLevel(confidenceLevel),
    });
  }

  function handleClose() {
    if (updateDomainKnowledgeMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateDomainKnowledgeMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateDomainKnowledgeMutation.error instanceof Error
      ? updateDomainKnowledgeMutation.error.message
      : null);

  if (!open || !domainKnowledge) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit domain knowledge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-name"
          label="Term / concept name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. OAuth 2.0, microservices, churn rate"
          autoFocus
        />

        <RichTextEditor
          key={`${domainKnowledge._id}-understanding`}
          id="edit-current-understanding"
          label="Current understanding"
          value={currentUnderstanding}
          onChange={setCurrentUnderstanding}
        />

        <RichTextEditor
          key={`${domainKnowledge._id}-questions`}
          id="edit-open-questions"
          label="Open questions"
          value={openQuestions}
          onChange={setOpenQuestions}
        />
        <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Things you&apos;re still fuzzy on — great AI chat fodder.
        </p>

        <Select
          id="edit-confidence-level"
          label="Confidence level (optional)"
          value={confidenceLevel}
          onChange={(event) => setConfidenceLevel(event.target.value)}
          options={[...DOMAIN_KNOWLEDGE_CONFIDENCE_OPTIONS]}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateDomainKnowledgeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateDomainKnowledgeMutation.isPending}
          >
            {updateDomainKnowledgeMutation.isPending
              ? "Saving..."
              : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
