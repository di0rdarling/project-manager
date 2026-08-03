"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type RefObject } from "react";
import toast from "react-hot-toast";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import PageContent from "@/components/layout/PageContent";
import { AgentDocumentSaveAsProjectNoteButton } from "@/components/agents/AgentDocumentSaveAsProjectNoteMenu";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { DocumentDetailContent } from "@/components/views/document-detail/DocumentDetailContent";
import { DocumentDetailHeader } from "@/components/views/document-detail/DocumentDetailHeader";
import { DocumentDetailLayout } from "@/components/views/document-detail/DocumentDetailLayout";
import { DocumentDetailToolbarActions } from "@/components/views/document-detail/DocumentDetailToolbarActions";
import { ContentWithChatLayout } from "@/components/views/shared/ContentWithChatLayout";
import { DocumentReviewChatPanel } from "@/components/views/AgentDocumentDetail/DocumentReviewChatPanel";
import { useEditableDocument } from "@/hooks/document-detail/useEditableDocument";
import { useSaveAgentDocumentAsProjectNote } from "@/hooks/mutations/agent-documents/useSaveAgentDocumentAsProjectNote";
import { useUpdateAgentDocumentContent } from "@/hooks/mutations/agent-documents/useUpdateAgentDocumentContent";
import { useFetchAgentDocument } from "@/hooks/queries/useFetchAgentDocument";
import {
  canEditAgentDocument,
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

const DOCUMENT_EDIT_FORM_ID = "agent-document-edit-form";

function DocumentBody({
  document,
  headings,
  hasHeadings,
  headingsKey,
  editorReadyKey = 0,
  contentElement,
  contentPanelRef,
  onSaveAsProjectNote,
  isSavingAsProjectNote = false,
  canEdit = false,
  isEditing = false,
  title = "",
  content = "",
  onTitleChange,
  onContentChange,
  onEditorReady,
  onStartEditing,
  onCancelEditing,
  onSubmit,
  isSaving = false,
  formError,
}: Readonly<{
  document: AgentDocumentResponse;
  teammateId: ChatTeammateId;
  headings: ReturnType<typeof useEditableDocument>["headings"];
  hasHeadings: boolean;
  headingsKey: string;
  editorReadyKey?: number;
  contentElement: HTMLElement | null;
  contentPanelRef: RefObject<HTMLDivElement | null>;
  onSaveAsProjectNote?: () => void;
  isSavingAsProjectNote?: boolean;
  canEdit?: boolean;
  isEditing?: boolean;
  title?: string;
  content?: string;
  onTitleChange?: (value: string) => void;
  onContentChange?: (value: string) => void;
  onEditorReady?: () => void;
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  isSaving?: boolean;
  formError?: string | null;
}>) {
  const canSaveAsProjectNote =
    canSaveAgentDocumentAsProjectNote(document) && Boolean(onSaveAsProjectNote);

  return (
    <DocumentDetailLayout
      hasHeadings={hasHeadings}
      tocContentKey={`${isEditing ? "edit" : "read"}-${headingsKey}-${editorReadyKey}`}
      headings={headings}
      contentElement={contentElement}
      isEditing={isEditing}
      formId={DOCUMENT_EDIT_FORM_ID}
      onSubmit={onSubmit}
      contentPanelRef={contentPanelRef}
      tocTitle="In this document"
      header={
        <DocumentDetailHeader
          label="Document"
          createdAt={document.createdAt}
          updatedAt={document.updatedAt}
          title={isEditing ? title : document.title || "Untitled document"}
          isEditing={isEditing}
          onTitleChange={onTitleChange}
          titleInputId="agent-document-title"
          autoFocusTitle={isEditing}
          actions={
            isEditing ? undefined : (
              <>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentDocumentStatusBadgeClassName(document.status)}`}
                >
                  {getAgentDocumentStatusLabel(document.status)}
                </span>
                {canEdit ? (
                  <IconButton
                    type="button"
                    aria-label="Edit document"
                    onClick={onStartEditing}
                  >
                    <PencilIcon className="size-4" />
                  </IconButton>
                ) : null}
                {canSaveAsProjectNote ? (
                  <AgentDocumentSaveAsProjectNoteButton
                    document={document}
                    onSave={onSaveAsProjectNote!}
                    isSaving={isSavingAsProjectNote}
                  />
                ) : null}
              </>
            )
          }
        />
      }
      footer={
        formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null
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
        isEditing={isEditing}
        editContent={content}
        readContent={document.content}
        headings={headings}
        onContentChange={onContentChange ?? (() => {})}
        onEditorReady={onEditorReady}
        contentLabel="Document content"
        toolbarActions={
          isEditing ? (
            <DocumentDetailToolbarActions
              onCancel={onCancelEditing ?? (() => {})}
              isSaving={isSaving}
            />
          ) : undefined
        }
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
  editorReadyKey,
  contentElement,
  contentPanelRef,
  onTaskRejected,
  canEdit,
  isEditing,
  title,
  content,
  onTitleChange,
  onContentChange,
  onEditorReady,
  onStartEditing,
  onCancelEditing,
  onSubmit,
  isSaving,
  formError,
}: Readonly<{
  document: AgentDocumentResponse;
  teammateId: ChatTeammateId;
  agentName: string;
  backHref: string;
  headings: ReturnType<typeof useEditableDocument>["headings"];
  hasHeadings: boolean;
  headingsKey: string;
  editorReadyKey: number;
  contentElement: HTMLElement | null;
  contentPanelRef: RefObject<HTMLDivElement | null>;
  onTaskRejected: () => void;
  canEdit: boolean;
  isEditing: boolean;
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onEditorReady: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  formError?: string | null;
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
            editorReadyKey={editorReadyKey}
            contentElement={contentElement}
            contentPanelRef={contentPanelRef}
            canEdit={canEdit}
            isEditing={isEditing}
            title={title}
            content={content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onEditorReady={onEditorReady}
            onStartEditing={onStartEditing}
            onCancelEditing={onCancelEditing}
            onSubmit={onSubmit}
            isSaving={isSaving}
            formError={formError}
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
            disableReviewActions={isEditing}
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

  const [mutationError, setMutationError] = useState<string | null>(null);
  const {
    isEditing,
    setIsEditing,
    title,
    setTitle,
    content,
    setContent,
    validationError,
    setValidationError,
    startEditing,
    cancelEditing,
    validate,
    clearValidationError,
    headings,
    hasHeadings,
    headingsKey,
    editorReadyKey,
    contentElement,
    contentPanelRef,
    notifyEditorReady,
  } = useEditableDocument(document, {
    titleRequiredMessage: "Document title is required",
    contentRequiredMessage: "Document content is required",
  });

  const updateContentMutation = useUpdateAgentDocumentContent({
    onSuccess: () => {
      toast.success("Document saved.");
      setIsEditing(false);
      setMutationError(null);
    },
    onError: (error) => {
      setMutationError(error.message);
    },
  });

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
  const canEdit = document ? canEditAgentDocument(document.status) : false;

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

  function handleStartEditing() {
    if (!canEdit) {
      return;
    }

    setMutationError(null);
    updateContentMutation.reset();
    startEditing();
  }

  function handleCancelEditing() {
    setMutationError(null);
    updateContentMutation.reset();
    cancelEditing();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!document || !teammateId) {
      return;
    }

    const nextValidationError = validate();
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    clearValidationError();
    setMutationError(null);
    updateContentMutation.mutate({
      teammateId,
      documentId: document._id,
      title: title.trim(),
      content,
      projectId: document.projectId,
    });
  }

  const formError = validationError ?? mutationError;

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
        editorReadyKey={editorReadyKey}
        contentElement={contentElement}
        contentPanelRef={contentPanelRef}
        onTaskRejected={() => router.push(backHref)}
        canEdit={canEdit}
        isEditing={isEditing}
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onEditorReady={notifyEditorReady}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onSubmit={handleSubmit}
        isSaving={updateContentMutation.isPending}
        formError={formError}
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
        editorReadyKey={editorReadyKey}
        contentElement={contentElement}
        contentPanelRef={contentPanelRef}
        onSaveAsProjectNote={handleSaveAsProjectNote}
        isSavingAsProjectNote={saveAsProjectNoteMutation.isPending}
        canEdit={canEdit}
        isEditing={isEditing}
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onEditorReady={notifyEditorReady}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onSubmit={handleSubmit}
        isSaving={updateContentMutation.isPending}
        formError={formError}
      />
    </PageContent>
  );
}
