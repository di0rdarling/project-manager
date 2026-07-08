"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/inputs/Input";
import { Select } from "@/components/ui/inputs/Select";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { useUpdateChallenge } from "@/hooks/mutations/challenges/useUpdateChallenge";
import {
  CHALLENGE_STATUS_OPTIONS,
  parseChallengeStatus,
} from "@/lib/challenges";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { ChallengeResponse } from "@/lib/types";

type EditChallengeModalProps = {
  open: boolean;
  projectId: string;
  challenge: ChallengeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditChallengeModal({
  open,
  projectId,
  challenge,
  onClose,
  onSuccess,
}: EditChallengeModalProps) {
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [status, setStatus] = useState("open");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title);
      setOverview(challenge.overview);
      setStatus(challenge.status);
      setValidationError(null);
    }
  }, [challenge]);

  const updateChallengeMutation = useUpdateChallenge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!challenge) {
      return;
    }

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
    updateChallengeMutation.mutate({
      projectId,
      challengeId: challenge._id,
      title: title.trim(),
      overview,
      status: parsedStatus,
    });
  }

  function handleClose() {
    if (updateChallengeMutation.isPending) {
      return;
    }

    setValidationError(null);
    updateChallengeMutation.reset();
    onClose();
  }

  const formError =
    validationError ??
    (updateChallengeMutation.error instanceof Error
      ? updateChallengeMutation.error.message
      : null);

  if (!open || !challenge) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit challenge">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What challenge or issue are you facing?"
          autoFocus
        />

        <RichTextEditor
          key={challenge._id}
          id="edit-overview"
          label="Overview"
          value={overview}
          onChange={setOverview}
        />

        <Select
          id="edit-status"
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
            disabled={updateChallengeMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateChallengeMutation.isPending}>
            {updateChallengeMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
