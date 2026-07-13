"use client";

import type { ReactNode } from "react";
import { formatDisplayDate } from "@/lib/dates";

type DocumentDetailHeaderProps = {
  label?: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  isEditing: boolean;
  onTitleChange?: (value: string) => void;
  titleInputId?: string;
  autoFocusTitle?: boolean;
  actions?: ReactNode;
};

export function DocumentDetailHeader({
  label = "Note",
  createdAt,
  updatedAt,
  title,
  isEditing,
  onTitleChange,
  titleInputId,
  autoFocusTitle = false,
  actions,
}: Readonly<DocumentDetailHeaderProps>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        {isEditing ? (
          <input
            id={titleInputId}
            value={title}
            onChange={(event) => onTitleChange?.(event.target.value)}
            autoFocus={autoFocusTitle}
            placeholder={`${label} title`}
            aria-label={`${label} title`}
            className="w-full border-0 bg-transparent p-0 text-4xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        ) : (
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
        )}
        <p className="text-xs text-zinc-500">
          Created {formatDisplayDate(createdAt)}
          {updatedAt !== createdAt
            ? ` · Updated ${formatDisplayDate(updatedAt)}`
            : null}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-start gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
