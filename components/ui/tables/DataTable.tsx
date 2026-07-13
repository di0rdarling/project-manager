"use client";

import { IconButton } from "@/components/ui/IconButton";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

const defaultHeaderClassName =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const defaultCellClassName =
  "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

const defaultActionsHeaderClassName =
  "w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const interactiveRowClassName =
  "cursor-pointer transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900/50 dark:focus-visible:outline-zinc-100";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: T) => ReactNode;
};

export type DataTableRowAction<T> = {
  key: string;
  label: string;
  icon: ReactNode;
  variant?: "default" | "danger";
  onClick: (item: T) => void;
  canPerform?: (item: T) => boolean;
};

type DataTableProps<T> = {
  items: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (item: T) => string;
  getRowLabel?: (item: T) => string;
  rowActions?: DataTableRowAction<T>[];
  actionsHeaderClassName?: string;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string | undefined;
  "aria-label"?: string;
};

export function DataTable<T>({
  items,
  columns,
  getRowKey,
  getRowLabel,
  rowActions = [],
  actionsHeaderClassName = defaultActionsHeaderClassName,
  onRowClick,
  getRowClassName,
  "aria-label": ariaLabel,
}: Readonly<DataTableProps<T>>) {
  const showActionsColumn = rowActions.length > 0;
  const isInteractive = Boolean(onRowClick);

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    item: T,
  ) {
    if (!onRowClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(item);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800"
          aria-label={ariaLabel}
        >
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.headerClassName ?? defaultHeaderClassName}
                >
                  {column.header}
                </th>
              ))}
              {showActionsColumn ? (
                <th scope="col" className={actionsHeaderClassName}>
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => {
              const rowKey = getRowKey(item);
              const rowLabel = getRowLabel?.(item);
              const visibleActions = rowActions.filter(
                (action) => action.canPerform?.(item) ?? true,
              );
              const customRowClassName = getRowClassName?.(item);

              return (
                <tr
                  key={rowKey}
                  tabIndex={isInteractive ? 0 : undefined}
                  role={isInteractive ? "link" : undefined}
                  aria-label={
                    isInteractive && rowLabel ? `View ${rowLabel}` : undefined
                  }
                  onClick={
                    onRowClick
                      ? () => {
                          onRowClick(item);
                        }
                      : undefined
                  }
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                  className={
                    customRowClassName ??
                    (isInteractive ? interactiveRowClassName : undefined)
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.cellClassName ?? defaultCellClassName}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  {showActionsColumn ? (
                    <td className="px-4 py-3 text-right">
                      {visibleActions.length > 0 ? (
                        <div className="relative z-10 inline-flex items-center justify-end gap-1">
                          {visibleActions.map((action) => (
                            <IconButton
                              key={action.key}
                              type="button"
                              variant={
                                action.variant === "danger" ? "danger" : "ghost"
                              }
                              aria-label={
                                rowLabel
                                  ? `${action.label} ${rowLabel}`
                                  : action.label
                              }
                              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                action.onClick(item);
                              }}
                            >
                              {action.icon}
                            </IconButton>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
