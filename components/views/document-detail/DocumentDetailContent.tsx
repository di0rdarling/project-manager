"use client";

import type { ReactNode } from "react";
import { RichTextContent } from "@/components/ui/inputs/richText/RichTextContent";
import { EnhancedRichTextEditor } from "@/components/ui/inputs/richText/EnhancedRichTextEditor";
import type { RichTextHeading } from "@/lib/rich-text";

type DocumentDetailContentProps = {
  documentId: string;
  contentInputId: string;
  isEditing: boolean;
  editContent: string;
  readContent: string;
  headings: RichTextHeading[];
  onContentChange: (value: string) => void;
  onContentElementChange: (element: HTMLElement | null) => void;
  toolbarActions?: ReactNode;
  contentLabel?: string;
};

export function DocumentDetailContent({
  documentId,
  contentInputId,
  isEditing,
  editContent,
  readContent,
  headings,
  onContentChange,
  onContentElementChange,
  toolbarActions,
  contentLabel = "Document content",
}: Readonly<DocumentDetailContentProps>) {
  if (isEditing) {
    return (
      <EnhancedRichTextEditor
        key={`${documentId}-edit`}
        id={contentInputId}
        label={contentLabel}
        value={editContent}
        onChange={onContentChange}
        onContentElementChange={onContentElementChange}
        hideLabel
        variant="embedded"
        toolbarActions={toolbarActions}
      />
    );
  }

  return (
    <div className="p-4">
      <RichTextContent
        content={readContent}
        headings={headings}
        className="text-sm text-zinc-800 dark:text-zinc-200"
      />
    </div>
  );
}
