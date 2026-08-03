"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type RefObject } from "react";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageContent from "@/components/layout/PageContent";
import { AgentDocumentSaveAsProjectNoteButton } from "@/components/agents/AgentDocumentSaveAsProjectNoteMenu";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { DocumentDetailContent } from "@/components/views/document-detail/DocumentDetailContent";
import { DocumentDetailHeader } from "@/components/views/document-detail/DocumentDetailHeader";
import { DocumentDetailLayout } from "@/components/views/document-detail/DocumentDetailLayout";
import { ContentWithChatLayout } from "@/components/views/shared/ContentWithChatLayout";
import { DocumentReviewChatPanel } from "@/components/views/AgentDocumentDetail/DocumentReviewChatPanel";
import { useDocumentHeadings } from "@/hooks/document-detail/useDocumentHeadings";
import { useSaveAgentDocumentAsProjectNote } from "@/hooks/mutations/agent-documents/useSaveAgentDocumentAsProjectNote";
import { useFetchAgentDocument } from "@/hooks/queries/useFetchAgentDocument";
import {
  canSaveAgentDocumentAsProjectNote,
  getAgentDocumentStatusBadgeClassName,
  getAgentDocumentStatusLabel,
  isAgentDocumentInReviewStage,
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
import type { AgentDocumentResponse } from "@/lib/types";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

interface AgentDocumentDetailViewProps {
  teammateId: string;
  documentId: string;
}

function DocumentBody({
  document,
  headings,
  hasHeadings,
  headingsKey,
  contentElement,
  contentPanelRef,
  onSaveAsProjectNote,
  isSavingAsProjectNote = false,
}: Readonly<{
  document: AgentDocumentResponse;
  teammateId: ChatTeammateId;
  headings: ReturnType<typeof useDocumentHeadings>["headings"];
  hasHeadings: boolean;
  headingsKey: string;
  contentElement: HTMLElement | null;
  contentPanelRef: RefObject<HTMLDivElement | null>;
  onSaveAsProjectNote?: () => void;
  isSavingAsProjectNote?: boolean;
}>) {
  const canSaveAsProjectNote =
    canSaveAgentDocumentAsProjectNote(document) && Boolean(onSaveAsProjectNote);

  return (
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
            <>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentDocumentStatusBadgeClassName(document.status)}`}
              >
                {getAgentDocumentStatusLabel(document.status)}
              </span>
              {canSaveAsProjectNote ? (
                <AgentDocumentSaveAsProjectNoteButton
                  document={document}
                  onSave={onSaveAsProjectNote!}
                  isSaving={isSavingAsProjectNote}
                />
              ) : null}
            </>
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
  );
}

function ReviewLayout({
  document,
  teammateId,
  agentName,
  backHref,
  headings,
  hasHeadings,
  headingsKey,
  contentElement,
  contentPanelRef,
  onTaskRejected,
}: Readonly<{
  document: AgentDocumentResponse;
  teammateId: ChatTeammateId;
  agentName: string;
  backHref: string;
  headings: ReturnType<typeof useDocumentHeadings>["headings"];
  hasHeadings: boolean;
  headingsKey: string;
  contentElement: HTMLElement | null;
  contentPanelRef: RefObject<HTMLDivElement | null>;
  onTaskRejected: () => void;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to {agentName}
        </Link>
      </header>

      <ContentWithChatLayout
        className="flex-1"
        content={
          <DocumentBody
            document={document}
            teammateId={teammateId}
            headings={headings}
            hasHeadings={hasHeadings}
            headingsKey={headingsKey}
            contentElement={contentElement}
            contentPanelRef={contentPanelRef}
          />
        }
        contentClassName="px-4 py-6 sm:px-6"
        chatPanel={
          <DocumentReviewChatPanel
            teammateId={teammateId}
            documentId={document._id}
            projectId={document.projectId}
            documentStatus={document.status}
            onTaskRejected={onTaskRejected}
          />
        }
      />
    </div>
  );
}

export default function AgentDocumentDetailView({
  teammateId: rawTeammateId,
  documentId,
}: Readonly<AgentDocumentDetailViewProps>) {
  const router = useRouter();
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

  const saveAsProjectNoteMutation = useSaveAgentDocumentAsProjectNote({
    onSuccess: (response) => {
      toast.success(
        response.alreadySaved
          ? "This document is already saved as a project note."
          : "Added to project notes.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add document to project notes.",
      );
    },
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

  const showReviewChat = document
    ? isAgentDocumentInReviewStage(document.status)
    : false;

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <LoadingMessage>Loading document...</LoadingMessage>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col gap-6 px-6 py-12">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to {agentName}
        </Link>
        <ErrorMessage error={error} fallbackMessage="Failed to load document" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  function handleSaveAsProjectNote() {
    if (!teammateId || saveAsProjectNoteMutation.isPending) {
      return;
    }

    saveAsProjectNoteMutation.mutate({
      teammateId,
      documentId,
    });
  }

  if (showReviewChat) {
    return (
      <ReviewLayout
        document={document}
        teammateId={teammateId}
        agentName={agentName}
        backHref={backHref}
        headings={headings}
        hasHeadings={hasHeadings}
        headingsKey={headingsKey}
        contentElement={contentElement}
        contentPanelRef={contentPanelRef}
        onTaskRejected={() => router.push(backHref)}
      />
    );
  }

  return (
    <PageContent>
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to {agentName}
      </Link>

      <DocumentBody
        document={document}
        teammateId={teammateId}
        headings={headings}
        hasHeadings={hasHeadings}
        headingsKey={headingsKey}
        contentElement={contentElement}
        contentPanelRef={contentPanelRef}
        onSaveAsProjectNote={handleSaveAsProjectNote}
        isSavingAsProjectNote={saveAsProjectNoteMutation.isPending}
      />
    </PageContent>
  );
}
