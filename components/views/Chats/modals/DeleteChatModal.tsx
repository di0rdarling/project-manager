"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteChat } from "@/hooks/mutations/chats/useDeleteChat";
import type { ChatResponse } from "@/lib/types";

type DeleteChatModalProps = {
  open: boolean;
  chat: ChatResponse | null;
  onClose: () => void;
  onSuccess: (chatTitle: string) => void;
};

export default function DeleteChatModal({
  open,
  chat,
  onClose,
  onSuccess,
}: DeleteChatModalProps) {
  const deleteChatMutation = useDeleteChat({
    onSuccess: () => {
      if (chat) {
        onSuccess(chat.title);
      }
      onClose();
    },
  });

  function handleDelete() {
    if (!chat) {
      return;
    }

    deleteChatMutation.mutate(chat._id);
  }

  function handleClose() {
    if (deleteChatMutation.isPending) {
      return;
    }

    deleteChatMutation.reset();
    onClose();
  }

  const formError =
    deleteChatMutation.error instanceof Error
      ? deleteChatMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Delete chat">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {chat?.title}
        </span>
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
          disabled={deleteChatMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteChatMutation.isPending}
        >
          {deleteChatMutation.isPending ? "Deleting..." : "Delete chat"}
        </Button>
      </div>
    </Modal>
  );
}
