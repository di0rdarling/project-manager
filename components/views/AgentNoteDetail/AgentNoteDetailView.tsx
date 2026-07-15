"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, PencilIcon, ShareIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import ShareAgentNoteModal from "@/components/views/Chats/modals/agent-notes/ShareAgentNoteModal";
import { EditableDocumentDetail } from "@/components/views/document-detail/EditableDocumentDetail";
import { useEditableDocument } from "@/hooks/document-detail/useEditableDocument";
import { useUpdateAgentNote } from "@/hooks/mutations/agent-notes/useUpdateAgentNote";
import { useFetchAgentNote } from "@/hooks/queries/useFetchAgentNote";
import { isAgentNoteOwner } from "@/lib/agents/agent-notes";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  getChatTeammate,
  isChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  AGENT_PROFILE_FROM_SEARCH_PARAM,
  appendAgentProfileFrom,
  parseAgentProfileFrom,
} from "@/lib/chats/agent-profile-navigation";

const AGENT_NOTE_FORM_ID = "agent-note-form";

interface AgentNoteDetailViewProps {
  teammateId: string;
  noteId: string;
}

export default function AgentNoteDetailView({
  teammateId: rawTeammateId,
  noteId,
}: Readonly<AgentNoteDetailViewProps>) {
  const searchParams = useSearchParams();
  const profileFrom = parseAgentProfileFrom(
    searchParams.get(AGENT_PROFILE_FROM_SEARCH_PARAM),
  );
  const teammateId = isChatTeammateId(rawTeammateId) ? rawTeammateId : null;
  const agentName = teammateId ? getChatTeammate(teammateId).name : "Agent";

  const {
    data: note,
    isPending: isNotePending,
    isError: isNoteError,
    error: noteError,
  } = useFetchAgentNote(teammateId ?? DEFAULT_CHAT_TEAMMATE_ID, noteId, {
    enabled: Boolean(teammateId),
  });

  const isOwner = note && teammateId ? isAgentNoteOwner(note, teammateId) : false;
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
  } = useEditableDocument(note, {
    canEdit: isOwner,
    titleRequiredMessage: "Note title is required",
    contentRequiredMessage: "Note content is required",
  });

  const updateAgentNoteMutation = useUpdateAgentNote({
    onSuccess: () => {
      toast.success("Note saved successfully.");
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

  const viewingTeammateId = teammateId;
  const backHref = appendAgentProfileFrom(
    `/chats/agents/${viewingTeammateId}`,
    profileFrom,
  );
  const backLabel = `Back to ${agentName}`;

  function handleStartEditing() {
    setMutationError(null);
    updateAgentNoteMutation.reset();
    startEditing();
  }

  function handleCancelEditing() {
    setMutationError(null);
    updateAgentNoteMutation.reset();
    cancelEditing();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note || !isOwner) {
      return;
    }

    const nextValidationError = validate();
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    clearValidationError();
    setMutationError(null);
    updateAgentNoteMutation.mutate({
      teammateId: viewingTeammateId,
      noteId: note._id,
      title: title.trim(),
      content,
    });
  }

  const formError = validationError ?? mutationError;

  return (
    <PageContent>
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {backLabel}
      </Link>

      {isNotePending ? (
        <LoadingMessage>Loading note...</LoadingMessage>
      ) : isNoteError ? (
        <ErrorMessage error={noteError} fallbackMessage="Failed to load note" />
      ) : (
        <EditableDocumentDetail
          document={note}
          formId={AGENT_NOTE_FORM_ID}
          titleInputId="agent-note-title"
          contentInputId="agent-note-content"
          isEditing={isEditing}
          canEdit={isOwner}
          title={title}
          content={content}
          headings={headings}
          hasHeadings={hasHeadings}
          headingsKey={headingsKey}
          editorReadyKey={editorReadyKey}
          contentElement={contentElement}
          contentPanelRef={contentPanelRef}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onEditorReady={notifyEditorReady}
          onStartEditing={handleStartEditing}
          onCancelEditing={handleCancelEditing}
          onSubmit={handleSubmit}
          isSaving={updateAgentNoteMutation.isPending}
          formError={formError}
          readActions={
            <>
              <IconButton
                type="button"
                aria-label="Share note"
                onClick={() => setIsShareModalOpen(true)}
              >
                <ShareIcon className="size-4" />
              </IconButton>
              {isOwner ? (
                <IconButton
                  type="button"
                  aria-label="Edit note"
                  onClick={handleStartEditing}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
              ) : null}
            </>
          }
        />
      )}

      <ShareAgentNoteModal
        open={isShareModalOpen}
        teammateId={viewingTeammateId}
        note={note ?? null}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={() => {
          setIsShareModalOpen(false);
          toast.success("Note sharing updated.");
        }}
      />
    </PageContent>
  );
}
