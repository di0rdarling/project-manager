"use client";

import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import {
  ItemActionsMenu,
  saveToNoteItemAction,
} from "@/components/ui/ItemActionsMenu";
import { getNoteDetailPath } from "@/lib/notes";
import type { AgentDocumentResponse } from "@/lib/types";

type AgentDocumentSaveAsProjectNoteMenuProps = {
  document: AgentDocumentResponse;
  onSave: () => void;
  isSaving?: boolean;
  visible?: boolean;
};

export function AgentDocumentSaveAsProjectNoteMenu({
  document,
  onSave,
  isSaving = false,
  visible = true,
}: Readonly<AgentDocumentSaveAsProjectNoteMenuProps>) {
  if (!visible) {
    return null;
  }

  if (document.savedProjectNoteId) {
    return (
      <ItemActionsMenu
        menuLabel={`Actions for ${document.title || "document"}`}
        actions={[
          {
            key: "view-project-note",
            label: "View project note",
            icon: <DocumentTextIcon className="size-4" aria-hidden />,
            href: getNoteDetailPath(
              document.projectId,
              document.savedProjectNoteId,
            ),
          },
        ]}
      />
    );
  }

  return (
    <ItemActionsMenu
      menuLabel={`Actions for ${document.title || "document"}`}
      actions={[
        saveToNoteItemAction("Add to project notes", onSave, isSaving),
      ]}
    />
  );
}

type AgentDocumentSaveAsProjectNoteButtonProps = {
  document: AgentDocumentResponse;
  onSave: () => void;
  isSaving?: boolean;
};

export function AgentDocumentSaveAsProjectNoteButton({
  document,
  onSave,
  isSaving = false,
}: Readonly<AgentDocumentSaveAsProjectNoteButtonProps>) {
  if (document.savedProjectNoteId) {
    return (
      <Link
        href={getNoteDetailPath(document.projectId, document.savedProjectNoteId)}
        className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-900"
      >
        View project note
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onSave}
      disabled={isSaving}
    >
      {isSaving ? "Adding..." : "Add to project notes"}
    </Button>
  );
}
