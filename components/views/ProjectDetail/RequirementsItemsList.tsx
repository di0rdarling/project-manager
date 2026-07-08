"use client";

import { useState, type ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { getRequirementPriorityLabel } from "@/lib/requirements";
import { formatDisplayDate } from "@/lib/dates";
import type { RequirementPriority, RequirementResponse } from "@/lib/types";

interface ItemModalRenderProps {
  open: boolean;
  item: RequirementResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface RequirementsItemsListProps {
  items: RequirementResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

function getPriorityBadgeClassName(
  priority: RequirementPriority,
): string {
  switch (priority) {
    case "must_have":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
    case "should_have":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "could_have":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export default function RequirementsItemsList({
  items,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<RequirementsItemsListProps>) {
  const [itemToEdit, setItemToEdit] = useState<RequirementResponse | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<RequirementResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h3>
                  {item.priority ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBadgeClassName(item.priority)}`}
                    >
                      {getRequirementPriorityLabel(item.priority)}
                    </span>
                  ) : null}
                </div>
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
                  aria-label="Edit requirement"
                  onClick={() => setItemToEdit(item)}
                >
                  <PencilIcon className="size-4" />
                </IconButton>
                <IconButton
                  type="button"
                  variant="danger"
                  aria-label="Delete requirement"
                  onClick={() => setItemToDelete(item)}
                >
                  <TrashIcon className="size-4 text-red-500" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
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
