"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useCreateChallenge } from "@/hooks/mutations/challenges/useCreateChallenge";
import {
  CHALLENGE_STATUS_OPTIONS,
  parseChallengeStatus,
} from "@/lib/challenges";
import { isRichTextEmpty } from "@/lib/rich-text";

type CreateChallengeModalProps = {
  open: boolean;
  projectId: string;
  featureId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateChallengeModal({
  open,
  projectId,
  featureId,
  onClose,
  onSuccess,
}: CreateChallengeModalProps) {
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [status, setStatus] = useState("open");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createChallengeMutation = useCreateChallenge({
    onSuccess: () => {
      setTitle("");
      setOverview("");
      setStatus("open");
      setValidationError(null);
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setValidationError("Challenge title is required");
      return;
    }

    if (isRichTextEmpty(overview)) {
      setValidationError("Challenge overview is required");
      return;
    }

    const parsedStatus = parseChallengeStatus(status);

    if (!parsedStatus) {
      setValidationError("Challenge status is required");
      return;
    }

    setValidationError(null);
    createChallengeMutation.mutate({
      projectId,
      title: title.trim(),
      overview,
      status: parsedStatus,
      featureId: featureId ?? null,
    });
  }

  function handleClose() {
    if (createChallengeMutation.isPending) {
      return;
    }

    setTitle("");
    setOverview("");
    setStatus("open");
    setValidationError(null);
    createChallengeMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (createChallengeMutation.error instanceof Error
      ? createChallengeMutation.error.message
      : null);

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Challenge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What challenge or issue are you facing?"
          autoFocus
        />

        <RichTextEditor
          key="create-challenge-overview"
          id="overview"
          label="Overview"
          value={overview}
          onChange={setOverview}
        />

        <Select
          id="status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[...CHALLENGE_STATUS_OPTIONS]}
        />

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createChallengeMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createChallengeMutation.isPending}>
            {createChallengeMutation.isPending ? "Adding..." : "Add challenge"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
