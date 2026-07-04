"use client";

import { useState, type ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { getConfidenceLevelLabel } from "@/lib/domain-knowledge";
import { formatDisplayDate } from "@/lib/dates";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { DomainKnowledgeResponse } from "@/lib/types";

interface ItemModalRenderProps {
  open: boolean;
  item: DomainKnowledgeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface DomainKnowledgeItemsListProps {
  items: DomainKnowledgeResponse[];
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  renderEditModal: (props: ItemModalRenderProps) => ReactNode;
  renderDeleteModal: (props: ItemModalRenderProps) => ReactNode;
}

export default function DomainKnowledgeItemsList({
  items,
  onEditSuccess,
  onDeleteSuccess,
  renderEditModal,
  renderDeleteModal,
}: Readonly<DomainKnowledgeItemsListProps>) {
  const [itemToEdit, setItemToEdit] = useState<DomainKnowledgeResponse | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] =
    useState<DomainKnowledgeResponse | null>(null);

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => {
          const confidenceLabel = getConfidenceLevelLabel(item.confidenceLevel);
          const hasOpenQuestions = !isRichTextEmpty(item.openQuestions);

          return (
            <li
              key={item._id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    {confidenceLabel ? (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {confidenceLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Current understanding
                    </p>
                    <RichTextContent
                      content={item.currentUnderstanding}
                      className="text-sm text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  {hasOpenQuestions ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Open questions
                      </p>
                      <RichTextContent
                        content={item.openQuestions}
                        className="text-sm text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                  ) : null}
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
                    aria-label="Edit domain knowledge item"
                    onClick={() => setItemToEdit(item)}
                  >
                    <PencilIcon className="size-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    variant="danger"
                    aria-label="Delete domain knowledge item"
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
