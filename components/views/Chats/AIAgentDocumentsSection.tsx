"use client";

import { useFetchAgentDocuments } from "@/hooks/queries/useFetchAgentDocuments";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentProfileFrom } from "@/lib/chats/agent-profile-navigation";
import AgentSection from "./AgentSection";
import AIAgentDocumentsList from "./AIAgentDocumentsList";

export const AGENT_DOCUMENTS_SECTION_ID = "agent-documents";

type AIAgentDocumentsSectionProps = {
  teammateId: ChatTeammateId;
  agentName: string;
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
};

export default function AIAgentDocumentsSection({
  teammateId,
  agentName,
  profileFrom,
  profileProjectId,
}: Readonly<AIAgentDocumentsSectionProps>) {
  const {
    data: documents = [],
    isPending,
    isError,
    error,
  } = useFetchAgentDocuments(teammateId);

  return (
    <AgentSection
      id={AGENT_DOCUMENTS_SECTION_ID}
      title="Documents"
      description={`Notes and documents ${agentName} generates from autonomous tasks, placed here for your review before you accept them.`}
      isPending={isPending}
      isError={isError}
      error={error}
      loadingMessage="Loading documents..."
      errorFallbackMessage="Failed to load documents"
      isEmpty={documents.length === 0}
      emptyMessage={`No documents from ${agentName} yet. When this teammate completes autonomous tasks that produce notes or documents, they will appear here for your review.`}
    >
      <AIAgentDocumentsList
        teammateId={teammateId}
        documents={documents}
        profileFrom={profileFrom}
        profileProjectId={profileProjectId}
      />
    </AgentSection>
  );
}
