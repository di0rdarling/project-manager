"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  PencilIcon,
  QueueListIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PageContent from "@/components/layout/PageContent";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/inputs/Input";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { RichTextEditor } from "@/components/ui/inputs/richText/RichTextEditor";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import ShareAgentNoteModal from "@/components/views/Chats/modals/agent-notes/ShareAgentNoteModal";
import { NoteTableOfContents } from "@/components/views/NoteDetail/NoteTableOfContents";
import { useNoteHeadings } from "@/hooks/notes/useNoteHeadings";
import { useUpdateAgentNote } from "@/hooks/mutations/agent-notes/useUpdateAgentNote";
import { useFetchAgentNote } from "@/hooks/queries/useFetchAgentNote";
import { isAgentNoteOwner } from "@/lib/agents/agent-notes";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { formatDisplayDate } from "@/lib/dates";
import { getRichTextHeadings, isRichTextEmpty } from "@/lib/rich-text";

interface AgentNoteDetailViewProps {
  teammateId: string;
  noteId: string;
}

export default function AgentNoteDetailView({
  teammateId: rawTeammateId,
  noteId,
}: Readonly<AgentNoteDetailViewProps>) {
  const teammateId = isChatTeammateId(rawTeammateId)
    ? rawTeammateId
    : null;
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

  const [isEditing, setIsEditing] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { contentRef, contentElement, hasHeadings } = useNoteHeadings(
    note?.content ?? "",
    !isEditing && Boolean(note),
  );
  const noteHeadings = useMemo(
    () => (note ? getRichTextHeadings(note.content) : []),
    [note],
  );

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setValidationError(null);
    }
  }, [note]);

  const updateAgentNoteMutation = useUpdateAgentNote({
    onSuccess: () => {
      toast.success("Note saved successfully.");
      setIsEditing(false);
    },
  });

  if (!teammateId) {
    return (
      <PageContent>
        <ErrorMessage
          error={null}
          fallbackMessage="Invalid agent profile"
        />
      </PageContent>
    );
  }

  const viewingTeammateId = teammateId;
  const backHref = `/chats/agents/${viewingTeammateId}`;
  const backLabel = `Back to ${agentName}`;

  function startEditing() {
    if (!note || !isOwner) {
      return;
    }

    setIsTocOpen(false);
    setTitle(note.title);
    setContent(note.content);
    setValidationError(null);
    updateAgentNoteMutation.reset();
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!note) {
      return;
    }

    setTitle(note.title);
    setContent(note.content);
    setValidationError(null);
    updateAgentNoteMutation.reset();
    setIsEditing(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note || !isOwner) {
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
    updateAgentNoteMutation.mutate({
      teammateId: viewingTeammateId,
      noteId: note._id,
      title: title.trim(),
      content,
    });
  }

  const formError =
    validationError ??
    (updateAgentNoteMutation.error instanceof Error
      ? updateAgentNoteMutation.error.message
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

      {isNotePending ? (
        <LoadingMessage>Loading note...</LoadingMessage>
      ) : isNoteError ? (
        <ErrorMessage error={noteError} fallbackMessage="Failed to load note" />
      ) : isEditing ? (
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
              id="agent-note-title"
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a title for this note"
              autoFocus
            />

            <RichTextEditor
              key={`${note._id}-edit`}
              id="agent-note-content"
              label="Note"
              value={content}
              onChange={setContent}
            />

            {formError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-10 -mx-6 border-t border-zinc-200 bg-zinc-50/95 px-6 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-black/95">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEditing}
                disabled={updateAgentNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAgentNoteMutation.isPending}>
                {updateAgentNoteMutation.isPending ? "Saving..." : "Save changes"}
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
                aria-label={
                  isTocOpen ? "Hide table of contents" : "Show table of contents"
                }
                aria-pressed={isTocOpen}
                aria-expanded={isTocOpen}
                aria-controls="note-table-of-contents"
                disabled={!hasHeadings}
                className={
                  isTocOpen
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                    : undefined
                }
                onClick={() => setIsTocOpen((current) => !current)}
              >
                <QueueListIcon className="size-4" />
              </IconButton>
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
                  onClick={startEditing}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
              ) : null}
            </div>
          </div>

          <NoteTableOfContents
            isOpen={isTocOpen}
            contentKey={`${note._id}-${note.updatedAt}`}
            contentElement={contentElement}
          />

          <div
            ref={contentRef}
            className="note-toc-content rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <RichTextContent
              content={note.content}
              headings={noteHeadings}
              className="text-sm text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
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
