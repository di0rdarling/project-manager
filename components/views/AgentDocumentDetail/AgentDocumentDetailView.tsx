"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageContent from "@/components/layout/PageContent";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { DocumentDetailContent } from "@/components/views/document-detail/DocumentDetailContent";
import { DocumentDetailHeader } from "@/components/views/document-detail/DocumentDetailHeader";
import { DocumentDetailLayout } from "@/components/views/document-detail/DocumentDetailLayout";
import { useDocumentHeadings } from "@/hooks/document-detail/useDocumentHeadings";
import { useFetchAgentDocument } from "@/hooks/queries/useFetchAgentDocument";
import {
  getAgentDocumentStatusBadgeClassName,
  getAgentDocumentStatusLabel,
} from "@/lib/agents/agent-documents";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  getChatTeammate,
  isChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  appendAgentProfileFrom,
  parseAgentProfileNavigationContext,
} from "@/lib/chats/agent-profile-navigation";

interface AgentDocumentDetailViewProps {
  teammateId: string;
  documentId: string;
}

export default function AgentDocumentDetailView({
  teammateId: rawTeammateId,
  documentId,
}: Readonly<AgentDocumentDetailViewProps>) {
  const searchParams = useSearchParams();
  const navigationContext = parseAgentProfileNavigationContext(searchParams);
  const teammateId = isChatTeammateId(rawTeammateId) ? rawTeammateId : null;
  const agentName = teammateId ? getChatTeammate(teammateId).name : "Agent";

  const {
    data: document,
    isPending,
    isError,
    error,
  } = useFetchAgentDocument(teammateId ?? DEFAULT_CHAT_TEAMMATE_ID, documentId, {
    enabled: Boolean(teammateId),
  });

  const {
    headings,
    hasHeadings,
    headingsKey,
    contentElement,
    contentPanelRef,
    syncContentPanelElement,
  } = useDocumentHeadings(document?.content ?? "");

  useEffect(() => {
    syncContentPanelElement();
  }, [document?.content, syncContentPanelElement]);

  if (!teammateId) {
    return (
      <PageContent>
        <ErrorMessage error={null} fallbackMessage="Invalid agent profile" />
      </PageContent>
    );
  }

  const backHref = appendAgentProfileFrom(
    `/chats/agents/${teammateId}`,
    navigationContext.from ?? null,
    navigationContext.projectId,
  );

  return (
    <PageContent>
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to {agentName}
      </Link>

      {isPending ? (
        <LoadingMessage>Loading document...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load document" />
      ) : document ? (
        <DocumentDetailLayout
          hasHeadings={hasHeadings}
          tocContentKey={headingsKey}
          headings={headings}
          contentElement={contentElement}
          isEditing={false}
          contentPanelRef={contentPanelRef}
          tocTitle="In this document"
          header={
            <DocumentDetailHeader
              label="Document"
              createdAt={document.createdAt}
              updatedAt={document.updatedAt}
              title={document.title || "Untitled document"}
              isEditing={false}
              actions={
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentDocumentStatusBadgeClassName(document.status)}`}
                >
                  {getAgentDocumentStatusLabel(document.status)}
                </span>
              }
            />
          }
        >
          {document.projectName ? (
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Project: {document.projectName}
            </p>
          ) : null}
          <DocumentDetailContent
            documentId={document._id}
            contentInputId="agent-document-content"
            isEditing={false}
            editContent={document.content}
            readContent={document.content}
            headings={headings}
            onContentChange={() => {}}
            contentLabel="Document content"
          />
        </DocumentDetailLayout>
      ) : null}
    </PageContent>
  );
}
