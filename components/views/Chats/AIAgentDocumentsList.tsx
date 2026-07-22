"use client";

import { ListItemDate } from "@/components/ui/ListItemDate";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/tables/DataTable";
import {
  getAgentDocumentStatusBadgeClassName,
  getAgentDocumentStatusLabel,
} from "@/lib/agents/agent-documents";
import type { AgentDocumentResponse } from "@/lib/types";

interface AIAgentDocumentsListProps {
  documents: AgentDocumentResponse[];
}

export default function AIAgentDocumentsList({
  documents,
}: Readonly<AIAgentDocumentsListProps>) {
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
  ];

  return (
    <DataTable
      items={documents}
      columns={columns}
      getRowKey={(document) => document._id}
      getRowLabel={(document) => document.title || "document"}
      defaultSort={{ columnKey: "createdAt", direction: "desc" }}
      aria-label="Documents"
    />
  );
}
