"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import type { FeatureResponse, RequirementResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ItemModalRenderProps {
  open: boolean;
  item: FeatureResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeatureItemsListProps {
  projectId: string;
  items: FeatureResponse[];
  requirements: RequirementResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

function getRequirementTitle(
  requirementId: string | null,
  requirements: RequirementResponse[],
): string | null {
  if (!requirementId) {
    return null;
  }

  const requirement = requirements.find((item) => item._id === requirementId);
  return requirement?.title.trim() || "Untitled requirement";
}

export default function FeatureItemsList({
  projectId,
  items,
  requirements,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<FeatureItemsListProps>) {
  const [itemToEdit, setItemToEdit] = useState<FeatureResponse | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FeatureResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => {
          const linkedRequirementTitle = getRequirementTitle(
            item.requirementId,
            requirements,
          );

          return (
            <li
              key={item._id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/projects/${projectId}/features/${item._id}`}
                  className="min-w-0 flex-1 space-y-2 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h3>
                  {linkedRequirementTitle ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Linked requirement: {linkedRequirementTitle}
                    </p>
                  ) : null}
                  <RichTextContent
                    content={item.content}
                    className="text-sm text-zinc-800 dark:text-zinc-200"
                  />
                </Link>
                <div className="flex shrink-0 items-start gap-1">
                  <time
                    dateTime={item.createdAt}
                    className="pt-2 text-xs text-zinc-500"
                  >
                    {formatDisplayDate(item.createdAt)}
                  </time>
                  <IconButton
                    type="button"
                    aria-label="Edit feature"
                    onClick={() => setItemToEdit(item)}
                  >
                    <PencilIcon className="size-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    variant="danger"
                    aria-label="Delete feature"
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
