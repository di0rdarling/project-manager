"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateDomainKnowledge } from "@/hooks/mutations/domainKnowledge/useCreateDomainKnowledge";
import {
  DOMAIN_KNOWLEDGE_CONFIDENCE_OPTIONS,
  parseConfidenceLevel,
} from "@/lib/domain-knowledge";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateDomainKnowledgeModalProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateDomainKnowledgeModal({
  open,
  projectId,
  onClose,
  onSuccess,
}: CreateDomainKnowledgeModalProps) {
  const [name, setName] = useState("");
  const [currentUnderstanding, setCurrentUnderstanding] = useState("");
  const [openQuestions, setOpenQuestions] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createDomainKnowledgeMutation = useCreateDomainKnowledge({
    onSuccess: () => {
      setName("");
      setCurrentUnderstanding("");
      setOpenQuestions("");
      setConfidenceLevel("");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setValidationError("Term or concept name is required");
      return;
    }

    if (isRichTextEmpty(currentUnderstanding)) {
      setValidationError("Current understanding is required");
      return;
    }

    setValidationError(null);
    createDomainKnowledgeMutation.mutate({
      projectId,
      name: name.trim(),
      currentUnderstanding,
      openQuestions,
      confidenceLevel: parseConfidenceLevel(confidenceLevel),
    });
  }

  function handleClose() {
    if (createDomainKnowledgeMutation.isPending) {
      return;
    }

    setName("");
    setCurrentUnderstanding("");
    setOpenQuestions("");
    setConfidenceLevel("");
    setValidationError(null);
    createDomainKnowledgeMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createDomainKnowledgeMutation.error instanceof Error
      ? createDomainKnowledgeMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Domain Knowledge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Term / concept name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. OAuth 2.0, microservices, churn rate"
          autoFocus
        />

        <RichTextEditor
          key="create-domain-knowledge-understanding"
          id="current-understanding"
          label="Current understanding"
          value={currentUnderstanding}
          onChange={setCurrentUnderstanding}
        />

        <RichTextEditor
          key="create-domain-knowledge-questions"
          id="open-questions"
          label="Open questions"
          value={openQuestions}
          onChange={setOpenQuestions}
        />
        <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Things you&apos;re still fuzzy on — great AI chat fodder.
        </p>

        <Select
          id="confidence-level"
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
            disabled={createDomainKnowledgeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createDomainKnowledgeMutation.isPending}
          >
            {createDomainKnowledgeMutation.isPending
              ? "Adding..."
              : "Add domain knowledge"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
