"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { EditableDocumentDetail } from "@/components/views/document-detail/EditableDocumentDetail";
import { useEditableDocument } from "@/hooks/document-detail/useEditableDocument";
import { useUpdateNote } from "@/hooks/mutations/notes/useUpdateNote";
import { useFetchFeature } from "@/hooks/queries/useFetchFeature";
import { useFetchNote } from "@/hooks/queries/useFetchNote";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { getFeatureNotesPath, getProjectNotesPath } from "@/lib/notes";

const NOTE_FORM_ID = "project-note-form";

interface NoteDetailViewProps {
  projectId: string;
  noteId: string;
}

export default function NoteDetailView({
  projectId,
  noteId,
}: Readonly<NoteDetailViewProps>) {
  const {
    data: note,
    isPending: isNotePending,
    isError: isNoteError,
    error: noteError,
  } = useFetchNote(projectId, noteId);

  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useFetchProject(projectId);

  const featureId = note?.featureId ?? null;

  const {
    data: feature,
    isPending: isFeaturePending,
    isError: isFeatureError,
    error: featureError,
  } = useFetchFeature(projectId, featureId ?? "", {
    enabled: Boolean(featureId),
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
  } = useEditableDocument(note, {
    titleRequiredMessage: "Note title is required",
    contentRequiredMessage: "Note content is required",
  });

  const updateNoteMutation = useUpdateNote({
    onSuccess: () => {
      toast.success("Note saved successfully.");
      setIsEditing(false);
      setMutationError(null);
    },
    onError: (error) => {
      setMutationError(error.message);
    },
  });

  const isPending =
    isNotePending || isProjectPending || (Boolean(featureId) && isFeaturePending);
  const isError =
    isNoteError || isProjectError || (Boolean(featureId) && isFeatureError);
  const error = noteError ?? projectError ?? featureError;

  const backHref = featureId
    ? getFeatureNotesPath(projectId, featureId)
    : getProjectNotesPath(projectId);
  const backLabel = featureId
    ? feature
      ? `Back to ${feature.title} notes`
      : "Back to feature notes"
    : "Back to notes";

  function handleStartEditing() {
    setMutationError(null);
    updateNoteMutation.reset();
    startEditing();
  }

  function handleCancelEditing() {
    setMutationError(null);
    updateNoteMutation.reset();
    cancelEditing();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note) {
      return;
    }

    const nextValidationError = validate();
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    clearValidationError();
    setMutationError(null);
    updateNoteMutation.mutate({
      projectId,
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

      {isPending ? (
        <LoadingMessage>Loading note...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load note" />
      ) : (
        <EditableDocumentDetail
          document={note}
          formId={NOTE_FORM_ID}
          titleInputId="note-title"
          contentInputId="note-content"
          isEditing={isEditing}
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
          isSaving={updateNoteMutation.isPending}
          formError={formError}
        />
      )}
    </PageContent>
  );
}
