"use client";

import { useState, type ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import type { ProjectContentItem } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ItemModalRenderProps<T extends ProjectContentItem> {
  open: boolean;
  item: T | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProjectItemsListProps<T extends ProjectContentItem> {
  items: T[];
  itemLabel: string;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps<T>) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps<T>) => ReactNode;
}

export default function ProjectItemsList<T extends ProjectContentItem>({
  items,
  itemLabel,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<ProjectItemsListProps<T>>) {
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => {
          const heading = item.title ?? item.name;

          return (
          <li
            key={item._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                {heading ? (
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    {heading}
                  </h3>
                ) : null}
                {item.role ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.role}
                  </p>
                ) : null}
                <RichTextContent
                  content={item.content}
                  className="text-sm text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <time
                  dateTime={item.createdAt}
                  className="pt-2 text-xs text-zinc-500"
                >
                  {formatDisplayDate(item.createdAt)}
                </time>
                <IconButton
                  type="button"
                  aria-label={`Edit ${itemLabel}`}
                  onClick={() => setItemToEdit(item)}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  aria-label={`Delete ${itemLabel}`}
                  onClick={() => setItemToDelete(item)}
                >
                  <TrashIcon className="size-4 text-red-500" />
                </IconButton>
              </div>
            </div>
          </li>
          );
        })}
      </ul>

      {renderEditModal({
        open: itemToEdit !== null,
        item: itemToEdit,
        onClose: () => setItemToEdit(null),
        onSuccess: () => {
          setItemToEdit(null);
          onEditSuccess?.();
        },
      })}

      {renderDeleteModal({
        open: itemToDelete !== null,
        item: itemToDelete,
        onClose: () => setItemToDelete(null),
        onSuccess: () => {
          setItemToDelete(null);
          onDeleteSuccess?.();
        },
      })}
    </>
  );
}
