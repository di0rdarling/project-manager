"use client";

import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentDocumentResponse } from "@/lib/types";
import AgentSection from "./AgentSection";
import AIAgentDocumentsList from "./AIAgentDocumentsList";

type AIAgentDocumentsSectionProps = {
  teammateId: ChatTeammateId;
  agentName: string;
};

export default function AIAgentDocumentsSection({
  teammateId: _teammateId,
  agentName,
}: Readonly<AIAgentDocumentsSectionProps>) {
  // Placeholder until autonomous task deliverables are persisted and fetched.
  const documents: AgentDocumentResponse[] = [];

  return (
    <AgentSection
      title="Documents"
      description={`Notes and documents ${agentName} generates from autonomous tasks, placed here for your review before you accept them.`}
      isPending={false}
      isError={false}
      error={null}
      loadingMessage="Loading documents..."
      errorFallbackMessage="Failed to load documents"
      isEmpty={documents.length === 0}
      emptyMessage={`No documents from ${agentName} yet. When this teammate completes autonomous tasks that produce notes or documents, they will appear here for your review.`}
    >
      <AIAgentDocumentsList documents={documents} />
    </AgentSection>
  );
}
