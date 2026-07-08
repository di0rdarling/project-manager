"use client";

import { useState, type ReactNode } from "react";
import {
  deleteItemAction,
  editItemAction,
  ItemActionsMenu,
} from "@/components/ui/ItemActionsMenu";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { getChallengeStatusLabel } from "@/lib/challenges";
import type { ChallengeResponse } from "@/lib/types";

interface ItemModalRenderProps {
  open: boolean;
  item: ChallengeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChallengesItemsListProps {
  items: ChallengeResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

function getStatusBadgeClassName(status: ChallengeResponse["status"]): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    case "resolved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
}

export default function ChallengesItemsList({
  items,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<ChallengesItemsListProps>) {
  const [itemToEdit, setItemToEdit] = useState<ChallengeResponse | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<ChallengeResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClassName(item.status)}`}
                    >
                      {getChallengeStatusLabel(item.status)}
                    </span>
                  </div>
                  <ListItemDate dateTime={item.createdAt} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Overview
                  </p>
                  <RichTextContent
                    content={item.overview}
                    className="text-sm text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <ItemActionsMenu
                actions={[
                  editItemAction("Edit challenge", () => setItemToEdit(item)),
                  deleteItemAction("Delete challenge", () =>
                    setItemToDelete(item),
                  ),
                ]}
              />
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
