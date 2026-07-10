"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ContextTag } from "@/components/ui/ContextTag";
import {
  deleteItemAction,
  editItemAction,
  ItemActionsMenu,
} from "@/components/ui/ItemActionsMenu";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import type { FeatureResponse, RequirementResponse } from "@/lib/types";

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

function getLinkedRequirementTitles(
  requirementIds: string[],
  requirements: RequirementResponse[],
): string[] {
  return requirementIds
    .map((requirementId) => {
      const requirement = requirements.find((item) => item._id === requirementId);
      return requirement?.title.trim() || "Untitled requirement";
    })
    .filter(Boolean);
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
          const linkedRequirementTitles = getLinkedRequirementTitles(
            item.requirementIds,
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
                  <div className="space-y-1">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <ListItemDate dateTime={item.createdAt} />
                  </div>
                  {linkedRequirementTitles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {linkedRequirementTitles.map((title) => (
                        <ContextTag
                          key={`${item._id}-${title}`}
                          className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {title}
                        </ContextTag>
                      ))}
                    </div>
                  ) : null}
                  <RichTextContent
                    content={item.content}
                    className="text-sm text-zinc-800 dark:text-zinc-200"
                  />
                </Link>
                <ItemActionsMenu
                  actions={[
                    editItemAction("Edit feature", () => setItemToEdit(item)),
                    deleteItemAction("Delete feature", () =>
                      setItemToDelete(item),
                    ),
                  ]}
                />
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
