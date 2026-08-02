"use client";

import { Modal } from "@/components/ui/Modal";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import { ChatReasoningEffortSelect } from "@/components/views/Chats/ChatReasoningEffortSelect";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { KimiReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";

type ChatModelSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  modelId: ChatModelId;
  reasoningEffort: KimiReasoningEffort;
  showReasoningEffort: boolean;
  disabled: boolean;
  onModelChange: (modelId: ChatModelId) => void;
  onReasoningEffortChange: (reasoningEffort: KimiReasoningEffort) => void;
};

export default function ChatModelSettingsModal({
  open,
  onClose,
  modelId,
  reasoningEffort,
  showReasoningEffort,
  disabled,
  onModelChange,
  onReasoningEffortChange,
}: Readonly<ChatModelSettingsModalProps>) {
  return (
    <Modal open={open} onClose={onClose} title="Model settings" size="narrow">
      <div className="space-y-4">
        <ChatModelSelect
          id="chat-model-modal"
          value={modelId}
          onChange={onModelChange}
          disabled={disabled}
          showLabel
          compact={false}
        />
        {showReasoningEffort ? (
          <ChatReasoningEffortSelect
            id="chat-reasoning-effort-modal"
            value={reasoningEffort}
            onChange={onReasoningEffortChange}
            disabled={disabled}
            showLabel
            compact={false}
          />
        ) : null}
      </div>
    </Modal>
  );
}
