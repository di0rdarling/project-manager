"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AISummarySection,
  type AISummaryMessages,
} from "@/components/ui/AISummarySection";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { useDeleteAgentMemory } from "@/hooks/mutations/chats/useDeleteAgentMemory";
import { useGenerateAgentMemory } from "@/hooks/mutations/chats/useGenerateAgentMemory";
import { useFetchAgentMemory } from "@/hooks/queries/useFetchAgentMemory";
import type { ChatTeammateId } from "@/lib/chat-teammates";

const AGENT_MEMORY_MESSAGES: AISummaryMessages = {
  emptyDescription:
    "Memory builds automatically as you chat — a compact first-person note of decisions, preferences, and open loops. You can also generate or rebuild it here from past chat summaries.",
  generating: "Generating agent memory...",
  regenerating: "Regenerating agent memory...",
  generateError: "Failed to generate agent memory",
  regenerateError: "Failed to regenerate agent memory",
};

interface AIAgentMemoryProps {
  teammateId: ChatTeammateId;
}

export default function AIAgentMemory({
  teammateId,
}: Readonly<AIAgentMemoryProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegeneratingRef = useRef(false);
  const { data: agentMemory, isFetching } = useFetchAgentMemory(teammateId);
  const {
    mutate: generateMemory,
    isPending: isGenerating,
    isSuccess,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
  } = useGenerateAgentMemory({
    onSuccess: () => {
      toast.success(
        isRegeneratingRef.current
          ? "Agent memory regenerated successfully."
          : "Agent memory generated successfully.",
      );
    },
  });
  const deleteMemoryMutation = useDeleteAgentMemory({
    onSuccess: () => {
      toast.success("Agent memory deleted successfully.");
      setIsDeleteModalOpen(false);
    },
  });

  function handleGenerate(isRegenerate: boolean) {
    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateMemory(teammateId);
  }

  function handleDeleteModalClose() {
    if (deleteMemoryMutation.isPending) {
      return;
    }

    deleteMemoryMutation.reset();
    setIsDeleteModalOpen(false);
  }

  return (
    <>
      <AISummarySection
        title="Memory"
        summary={agentMemory?.memory ?? null}
        isFetching={isFetching}
        isGenerating={isGenerating}
        isGenerateError={isGenerateError}
        generateError={generateError}
        isSuccess={isSuccess}
        messages={AGENT_MEMORY_MESSAGES}
        onGenerate={handleGenerate}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />

      <DeleteAISummaryModal
        open={isDeleteModalOpen}
        description="Are you sure you want to delete this agent memory? It will rebuild automatically as you keep chatting, or you can generate a new one anytime."
        isPending={deleteMemoryMutation.isPending}
        error={deleteMemoryMutation.error}
        onClose={handleDeleteModalClose}
        onConfirm={() => deleteMemoryMutation.mutate(teammateId)}
      />
    </>
  );
}
