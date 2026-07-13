"use client";

import type { FormEvent, ReactNode } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/IconButton";
import { DocumentDetailContent } from "@/components/views/document-detail/DocumentDetailContent";
import { DocumentDetailHeader } from "@/components/views/document-detail/DocumentDetailHeader";
import { DocumentDetailLayout } from "@/components/views/document-detail/DocumentDetailLayout";
import { DocumentDetailToolbarActions } from "@/components/views/document-detail/DocumentDetailToolbarActions";
import type { RichTextHeading } from "@/lib/rich-text";

export type DocumentDetailRecord = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type EditableDocumentDetailProps = {
  document: DocumentDetailRecord;
  formId: string;
  titleInputId: string;
  contentInputId: string;
  label?: string;
  isEditing: boolean;
  canEdit?: boolean;
  title: string;
  content: string;
  headings: RichTextHeading[];
  hasHeadings: boolean;
  headingsKey: string;
  contentElement: HTMLElement | null;
  contentPanelRef: React.RefObject<HTMLDivElement | null>;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onContentElementChange: (element: HTMLElement | null) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  formError?: string | null;
  readActions?: ReactNode;
  tocTitle?: string;
};

export function EditableDocumentDetail({
  document,
  formId,
  titleInputId,
  contentInputId,
  label = "Note",
  isEditing,
  canEdit = true,
  title,
  content,
  headings,
  hasHeadings,
  headingsKey,
  contentElement,
  contentPanelRef,
  onTitleChange,
  onContentChange,
  onContentElementChange,
  onStartEditing,
  onCancelEditing,
  onSubmit,
  isSaving,
  formError,
  readActions,
  tocTitle,
}: Readonly<EditableDocumentDetailProps>) {
  const defaultReadActions = canEdit ? (
    <IconButton type="button" aria-label={`Edit ${label.toLowerCase()}`} onClick={onStartEditing}>
      <PencilIcon className="size-4" />
    </IconButton>
  ) : null;

  return (
    <DocumentDetailLayout
      hasHeadings={hasHeadings}
      tocContentKey={`${document._id}-${isEditing ? "edit" : "read"}-${headingsKey}`}
      contentElement={contentElement}
      contentPanelRef={contentPanelRef}
      isEditing={isEditing}
      formId={formId}
      onSubmit={onSubmit}
      tocTitle={tocTitle}
      header={
        <DocumentDetailHeader
          label={label}
          createdAt={document.createdAt}
          updatedAt={document.updatedAt}
          title={isEditing ? title : document.title}
          isEditing={isEditing}
          onTitleChange={onTitleChange}
          titleInputId={titleInputId}
          autoFocusTitle={isEditing}
          actions={isEditing ? undefined : (readActions ?? defaultReadActions)}
        />
      }
      footer={
        formError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null
      }
    >
      <DocumentDetailContent
        documentId={document._id}
        contentInputId={contentInputId}
        isEditing={isEditing}
        editContent={content}
        readContent={document.content}
        headings={headings}
        onContentChange={onContentChange}
        onContentElementChange={onContentElementChange}
        contentLabel={`${label} content`}
        toolbarActions={
          <DocumentDetailToolbarActions
            onCancel={onCancelEditing}
            isSaving={isSaving}
          />
        }
      />
    </DocumentDetailLayout>
  );
}
