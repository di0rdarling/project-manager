"use client";

import type { MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ListItemDate } from "@/components/ui/ListItemDate";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/tables/DataTable";
import { AgentDocumentSaveAsProjectNoteMenu } from "@/components/agents/AgentDocumentSaveAsProjectNoteMenu";
import { useSaveAgentDocumentAsProjectNote } from "@/hooks/mutations/agent-documents/useSaveAgentDocumentAsProjectNote";
import { getAgentTaskProjectBadgeClassName } from "@/lib/agents/agent-tasks";
import {
  canSaveAgentDocumentAsProjectNote,
  getAgentDocumentDetailPath,
  getAgentDocumentStatusBadgeClassName,
  getAgentDocumentStatusLabel,
} from "@/lib/agents/agent-documents";
import {
  appendAgentProfileFrom,
  appendAgentProfileTaskTitle,
  type AgentProfileFrom,
} from "@/lib/chats/agent-profile-navigation";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentDocumentResponse } from "@/lib/types";

interface AIAgentDocumentsListProps {
  teammateId: ChatTeammateId;
  documents: AgentDocumentResponse[];
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
}

export default function AIAgentDocumentsList({
  teammateId,
  documents,
  profileFrom,
  profileProjectId,
}: Readonly<AIAgentDocumentsListProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    mutate: saveAsProjectNote,
    isPending: isSavingAsProjectNote,
    variables: saveAsProjectNoteVariables,
  } = useSaveAgentDocumentAsProjectNote({
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

  function handleSaveAsProjectNote(document: AgentDocumentResponse) {
    saveAsProjectNote({
      teammateId,
      documentId: document._id,
    });
  }

  function isSavingDocumentAsProjectNote(document: AgentDocumentResponse) {
    return (
      isSavingAsProjectNote &&
      saveAsProjectNoteVariables?.documentId === document._id
    );
  }

  function handleTaskClick(
    event: MouseEvent,
    document: AgentDocumentResponse,
  ) {
    event.stopPropagation();

    if (!document.taskTitle) {
      return;
    }

    const currentPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    const profilePath = appendAgentProfileFrom(
      currentPath,
      profileFrom ?? null,
      profileProjectId,
    );

    router.push(
      appendAgentProfileTaskTitle(
        profilePath,
        document.taskTitle,
        document.projectId,
      ),
    );
  }

  const columns: DataTableColumn<AgentDocumentResponse>[] = [
    {
      key: "title",
      header: "Title",
      cellClassName:
        "px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100",
      render: (document) => document.title || "Untitled document",
      getSortValue: (document) =>
        (document.title || "Untitled document").toLocaleLowerCase(),
    },
    {
      key: "task",
      header: "Task",
      cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
      render: (document) =>
        document.taskTitle ? (
          <button
            type="button"
            onClick={(event) => handleTaskClick(event, document)}
            title={document.taskTitle}
            className={`inline-flex max-w-[12rem] truncate rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${getAgentTaskProjectBadgeClassName()}`}
          >
            {document.taskTitle}
          </button>
        ) : (
          "—"
        ),
      getSortValue: (document) =>
        (document.taskTitle ?? "").toLocaleLowerCase(),
    },
    {
      key: "project",
      header: "Project",
      cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
      render: (document) => document.projectName ?? "—",
      getSortValue: (document) =>
        (document.projectName ?? "").toLocaleLowerCase(),
    },
    {
      key: "createdAt",
      header: "Created",
      cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
      render: (document) => <ListItemDate dateTime={document.createdAt} />,
      getSortValue: (document) => document.createdAt,
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400",
      render: (document) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentDocumentStatusBadgeClassName(document.status)}`}
        >
          {getAgentDocumentStatusLabel(document.status)}
        </span>
      ),
      getSortValue: (document) => document.status,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12 px-4 py-3",
      cellClassName: "px-4 py-3 text-right",
      sortable: false,
      render: (document) =>
        canSaveAgentDocumentAsProjectNote(document) ? (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <AgentDocumentSaveAsProjectNoteMenu
              document={document}
              onSave={() => handleSaveAsProjectNote(document)}
              isSaving={isSavingDocumentAsProjectNote(document)}
            />
          </div>
        ) : null,
    },
  ];

  return (
    <DataTable
      items={documents}
      columns={columns}
      getRowKey={(document) => document._id}
      getRowLabel={(document) => document.title || "document"}
      onRowClick={(document) =>
        router.push(
          appendAgentProfileFrom(
            getAgentDocumentDetailPath(teammateId, document._id),
            profileFrom ?? null,
            profileProjectId,
          ),
        )
      }
      defaultSort={{ columnKey: "createdAt", direction: "desc" }}
      aria-label="Documents"
    />
  );
}
