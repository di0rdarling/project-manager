"use client";

import { Modal } from "@/components/ui/Modal";

type ChatSummaryModalProps = {
  open: boolean;
  summary: string | null;
  onClose: () => void;
};

export default function ChatSummaryModal({
  open,
  summary,
  onClose,
}: Readonly<ChatSummaryModalProps>) {
  return (
    <Modal open={open} onClose={onClose} title="Conversation Summary">
      {summary ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {summary}
        </p>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No summary is available yet. Send a message and wait for a reply to
          generate one.
        </p>
      )}
    </Modal>
  );
}
