"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArchiveChat } from "@/hooks/mutations/chats/useArchiveChat";
import type { ChatResponse } from "@/lib/types";

type ArchiveChatModalProps = {
  open: boolean;
  chat: ChatResponse | null;
  onClose: () => void;
  onSuccess: (chatTitle: string) => void;
};

export default function ArchiveChatModal({
  open,
  chat,
  onClose,
  onSuccess,
}: ArchiveChatModalProps) {
  const archiveChatMutation = useArchiveChat({
    onSuccess: () => {
      if (chat) {
        onSuccess(chat.title);
      }
      onClose();
    },
  });

  function handleArchive() {
    if (!chat) {
      return;
    }

    archiveChatMutation.mutate(chat._id);
  }

  function handleClose() {
    if (archiveChatMutation.isPending) {
      return;
    }

    archiveChatMutation.reset();
    onClose();
  }

  const formError =
    archiveChatMutation.error instanceof Error
      ? archiveChatMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Archive chat" size="narrow">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Archive{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {chat?.title}
        </span>
        ? The chat and its messages will be kept, but its summary will be
        compressed into a compact memory for your AI teammate. You can unarchive
        it later to continue the conversation.
      </p>

      {formError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={archiveChatMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleArchive}
          disabled={archiveChatMutation.isPending}
        >
          {archiveChatMutation.isPending ? "Archiving..." : "Archive chat"}
        </Button>
      </div>
    </Modal>
  );
}
