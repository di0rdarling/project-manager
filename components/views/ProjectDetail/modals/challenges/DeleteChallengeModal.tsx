"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteChallenge } from "@/hooks/mutations/challenges/useDeleteChallenge";
import { getRichTextPreview } from "@/lib/rich-text";
import type { ChallengeResponse } from "@/lib/types";

type DeleteChallengeModalProps = {
  open: boolean;
  projectId: string;
  challenge: ChallengeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteChallengeModal({
  open,
  projectId,
  challenge,
  onClose,
  onSuccess,
}: DeleteChallengeModalProps) {
  const deleteChallengeMutation = useDeleteChallenge({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleDelete() {
    if (!challenge) {
      return;
    }

    deleteChallengeMutation.mutate({
      projectId,
      challengeId: challenge._id,
      featureId: challenge.featureId,
    });
  }

  function handleClose() {
    if (deleteChallengeMutation.isPending) {
      return;
    }

    deleteChallengeMutation.reset();
    onClose();
  }

  const formError =
    deleteChallengeMutation.error instanceof Error
      ? deleteChallengeMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete challenge">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete this challenge
        {challenge ? (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;
              {challenge.title.trim() ||
                getRichTextPreview(challenge.overview)}
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
          disabled={deleteChallengeMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteChallengeMutation.isPending}
        >
          {deleteChallengeMutation.isPending ? "Deleting..." : "Delete challenge"}
        </Button>
      </div>
    </Modal>
  );
}
