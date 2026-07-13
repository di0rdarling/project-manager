"use client";

import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import {
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

const defaultHeaderClassName =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const defaultCellClassName =
  "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

const defaultActionsHeaderClassName =
  "w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const sortableHeaderButtonClassName =
  "group inline-flex w-full cursor-pointer items-center gap-1 rounded-md text-left transition-colors hover:text-zinc-700 dark:hover:text-zinc-200";

const sortIconContainerClassName =
  "inline-flex size-3.5 shrink-0 items-center justify-center";

const rowClassName =
  "border-b border-zinc-200 last:border-b-0 dark:border-zinc-800";

const interactiveRowClassName =
  "cursor-pointer transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900/50 dark:focus-visible:outline-zinc-100";

export type DataTableSortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: T) => ReactNode;
  getSortValue?: (item: T) => string | number | null | undefined;
  sortable?: boolean;
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
  defaultSort?: {
    columnKey: string;
    direction: DataTableSortDirection;
  };
  "aria-label"?: string;
};

function isColumnSortable<T>(column: DataTableColumn<T>): boolean {
  return column.sortable !== false && Boolean(column.getSortValue);
}

function compareSortValues(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
  direction: DataTableSortDirection,
): number {
  const leftValue = left ?? "";
  const rightValue = right ?? "";

  let result = 0;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    result = leftValue - rightValue;
  } else {
    result = String(leftValue).localeCompare(String(rightValue), undefined, {
      sensitivity: "base",
      numeric: true,
    });
  }

  return direction === "asc" ? result : -result;
}

export function DataTable<T>({
  items,
  columns,
  getRowKey,
  getRowLabel,
  rowActions = [],
  actionsHeaderClassName = defaultActionsHeaderClassName,
  onRowClick,
  getRowClassName,
  defaultSort,
  "aria-label": ariaLabel,
}: Readonly<DataTableProps<T>>) {
  const [sortState, setSortState] = useState<{
    columnKey: string;
    direction: DataTableSortDirection;
  } | null>(defaultSort ?? null);

  const showActionsColumn = rowActions.length > 0;
  const isInteractive = Boolean(onRowClick);

  const sortedItems = useMemo(() => {
    if (!sortState) {
      return items;
    }

    const sortColumn = columns.find((column) => column.key === sortState.columnKey);

    if (!sortColumn?.getSortValue) {
      return items;
    }

    const getSortValue = sortColumn.getSortValue;

    return [...items].sort((left, right) =>
      compareSortValues(
        getSortValue(left),
        getSortValue(right),
        sortState.direction,
      ),
    );
  }, [columns, items, sortState]);

  function handleSort(columnKey: string) {
    setSortState((current) => {
      if (current?.columnKey === columnKey) {
        return {
          columnKey,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        columnKey,
        direction: "asc",
      };
    });
  }

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

  function renderSortIcon(columnKey: string, sortable: boolean) {
    if (!sortable) {
      return null;
    }

    if (sortState?.columnKey === columnKey) {
      return (
        <span className={sortIconContainerClassName}>
          {sortState.direction === "asc" ? (
            <ChevronUpIcon className="size-3.5" aria-hidden />
          ) : (
            <ChevronDownIcon className="size-3.5" aria-hidden />
          )}
        </span>
      );
    }

    return (
      <span className={sortIconContainerClassName}>
        <ChevronUpDownIcon
          className="size-3.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500"
          aria-hidden
        />
      </span>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse" aria-label={ariaLabel}>
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              {columns.map((column) => {
                const sortable = isColumnSortable(column);
                const ariaSort =
                  sortState?.columnKey === column.key
                    ? sortState.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : sortable
                      ? "none"
                      : undefined;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={column.headerClassName ?? defaultHeaderClassName}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={sortableHeaderButtonClassName}
                        onClick={() => handleSort(column.key)}
                      >
                        <span>{column.header}</span>
                        {renderSortIcon(column.key, sortable)}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {showActionsColumn ? (
                <th scope="col" className={actionsHeaderClassName}>
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
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
                    [
                      rowClassName,
                      customRowClassName,
                      isInteractive ? interactiveRowClassName : undefined,
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
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
