"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/ui/tables/DataTable";
import type { ReactNode } from "react";

export type NotesTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cellClassName?: string;
  render: (item: T) => ReactNode;
};

export type NotesTableRowAction<T> = DataTableRowAction<T>;

type NotesTableProps<T extends { _id: string }> = {
  items: T[];
  columns: NotesTableColumn<T>[];
  getItemHref: (item: T) => string;
  getItemLabel: (item: T) => string;
  rowActions?: NotesTableRowAction<T>[];
};

export function NotesTable<T extends { _id: string }>({
  items,
  columns,
  getItemHref,
  getItemLabel,
  rowActions = [],
}: Readonly<NotesTableProps<T>>) {
  const router = useRouter();

  const dataTableColumns: DataTableColumn<T>[] = columns.map((column) => ({
    key: column.key,
    header: column.header,
    headerClassName: column.className,
    cellClassName: column.cellClassName,
    render: column.render,
  }));

  return (
    <DataTable
      items={items}
      columns={dataTableColumns}
      getRowKey={(item) => item._id}
      getRowLabel={getItemLabel}
      rowActions={rowActions}
      onRowClick={(item) => router.push(getItemHref(item))}
      aria-label="Notes"
    />
  );
}
