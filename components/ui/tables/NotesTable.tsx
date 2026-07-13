"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
  type DataTableSortDirection,
} from "@/components/ui/tables/DataTable";
import type { ReactNode } from "react";

export type NotesTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cellClassName?: string;
  render: (item: T) => ReactNode;
  getSortValue?: (item: T) => string | number | null | undefined;
  sortable?: boolean;
};

export type NotesTableRowAction<T> = DataTableRowAction<T>;

type NotesTableProps<T extends { _id: string }> = {
  items: T[];
  columns: NotesTableColumn<T>[];
  getItemHref: (item: T) => string;
  getItemLabel: (item: T) => string;
  rowActions?: NotesTableRowAction<T>[];
  defaultSort?: {
    columnKey: string;
    direction: DataTableSortDirection;
  };
};

export function NotesTable<T extends { _id: string }>({
  items,
  columns,
  getItemHref,
  getItemLabel,
  rowActions = [],
  defaultSort,
}: Readonly<NotesTableProps<T>>) {
  const router = useRouter();

  const dataTableColumns: DataTableColumn<T>[] = columns.map((column) => ({
    key: column.key,
    header: column.header,
    headerClassName: column.className,
    cellClassName: column.cellClassName,
    render: column.render,
    getSortValue: column.getSortValue,
    sortable: column.sortable,
  }));

  return (
    <DataTable
      items={items}
      columns={dataTableColumns}
      getRowKey={(item) => item._id}
      getRowLabel={getItemLabel}
      rowActions={rowActions}
      onRowClick={(item) => router.push(getItemHref(item))}
      defaultSort={defaultSort}
      aria-label="Notes"
    />
  );
}
