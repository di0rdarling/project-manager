"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { EnhancedRichTextEditor } from "@/components/ui/inputs/richText/EnhancedRichTextEditor";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { NoteTableOfContents } from "@/components/views/NoteDetail/NoteTableOfContents";
import { useNoteHeadings } from "@/hooks/notes/useNoteHeadings";
import { useUpdateNote } from "@/hooks/mutations/notes/useUpdateNote";
import { useFetchFeature } from "@/hooks/queries/useFetchFeature";
import { useFetchNote } from "@/hooks/queries/useFetchNote";
import { useFetchProject } from "@/hooks/queries/useFetchProject";
import { formatDisplayDate } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";

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

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { headings, hasHeadings, headingsKey, contentElement, setContentElement, readContentRef } =
    useNoteHeadings(content);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setValidationError(null);
    }
  }, [note]);

  const updateNoteMutation = useUpdateNote({
    onSuccess: () => {
      toast.success("Note saved successfully.");
      setIsEditing(false);
    },
  });

  const isPending =
    isNotePending || isProjectPending || (Boolean(featureId) && isFeaturePending);
  const isError =
    isNoteError || isProjectError || (Boolean(featureId) && isFeatureError);
  const error = noteError ?? projectError ?? featureError;

  const backHref = featureId
    ? `/projects/${projectId}/features/${featureId}`
    : `/projects/${projectId}`;
  const backLabel = featureId
    ? feature
      ? `Back to ${feature.title}`
      : "Back to feature"
    : project
      ? `Back to ${project.name}`
      : "Back to project";

  function startEditing() {
    if (!note) {
      return;
    }

    setTitle(note.title);
    setContent(note.content);
    setValidationError(null);
    updateNoteMutation.reset();
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!note) {
      return;
    }

    setTitle(note.title);
    setContent(note.content);
    setValidationError(null);
    updateNoteMutation.reset();
    setIsEditing(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note) {
      return;
    }

    if (!title.trim()) {
      setValidationError("Note title is required");
      return;
    }

    if (isRichTextEmpty(content)) {
      setValidationError("Note content is required");
      return;
    }

    setValidationError(null);
    updateNoteMutation.mutate({
      projectId,
      noteId: note._id,
      title: title.trim(),
      content,
    });
  }

  const formError =
    validationError ??
    (updateNoteMutation.error instanceof Error
      ? updateNoteMutation.error.message
      : null);

  return (
    <PageContent className={isEditing ? "pb-0" : undefined}>
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
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-start">
          {hasHeadings ? (
            <NoteTableOfContents
              contentKey={`${note._id}-${isEditing ? "edit" : "read"}-${headingsKey}`}
              contentElement={contentElement}
              className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="space-y-6 pb-28">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Note
                    </p>
                    <p className="text-xs text-zinc-500">
                      Created {formatDisplayDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt
                        ? ` · Updated ${formatDisplayDate(note.updatedAt)}`
                        : null}
                    </p>
                  </div>

                  <Input
                    id="note-title"
                    label="Title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter a title for this note"
                    autoFocus
                  />

                  <EnhancedRichTextEditor
                    key={`${note._id}-edit`}
                    id="note-content"
                    label="Note"
                    value={content}
                    onChange={setContent}
                    onContentElementChange={setContentElement}
                  />

                  {formError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formError}
                    </p>
                  ) : null}
                </div>

                <div className="sticky bottom-0 z-10 -mx-6 border-t border-zinc-200 bg-zinc-50/95 px-6 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-black/95">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEditing}
                      disabled={updateNoteMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateNoteMutation.isPending}>
                      {updateNoteMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Note
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {note.title}
                    </h1>
                    <p className="text-xs text-zinc-500">
                      Created {formatDisplayDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt
                        ? ` · Updated ${formatDisplayDate(note.updatedAt)}`
                        : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <IconButton
                      type="button"
                      aria-label="Edit note"
                      onClick={startEditing}
                    >
                      <PencilIcon className="size-4" />
                    </IconButton>
                  </div>
                </div>

                <div
                  ref={readContentRef}
                  className="note-toc-content rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <RichTextContent
                    content={note.content}
                    headings={headings}
                    className="text-sm text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContent>
  );
}
