"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/inputs/Input";
import { Modal } from "@/components/ui/Modal";
import { useUpdateChat } from "@/hooks/mutations/chats/useUpdateChat";
import type { ChatResponse } from "@/lib/types";

type EditChatTitleModalProps = {
  open: boolean;
  chat: ChatResponse | null;
  onClose: () => void;
  onSuccess: (chatTitle: string) => void;
};

export default function EditChatTitleModal({
  open,
  chat,
  onClose,
  onSuccess,
}: EditChatTitleModalProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (chat) {
      setTitle(chat.title);
    }
  }, [chat]);

  const updateChatMutation = useUpdateChat({
    onSuccess: (updatedChat) => {
      onSuccess(updatedChat.title);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chat) {
      return;
    }

    updateChatMutation.mutate({
      chatId: chat._id,
      title,
    });
  }

  function handleClose() {
    if (updateChatMutation.isPending) {
      return;
    }

    updateChatMutation.reset();
    onClose();
  }

  const formError =
    updateChatMutation.error instanceof Error
      ? updateChatMutation.error.message
      : null;

  return (
    <Modal open={open} onClose={handleClose} title="Edit chat title" size="narrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-chat-title"
          label="Chat title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="My chat"
          required
          maxLength={200}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Setting a title here keeps it fixed, so it won&apos;t be replaced by
          an AI-generated title later in the conversation.
        </p>

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateChatMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateChatMutation.isPending}>
            {updateChatMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
