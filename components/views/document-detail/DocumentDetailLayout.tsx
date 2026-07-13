"use client";

import type { FormEvent, ReactNode } from "react";
import { TableOfContents } from "@/components/views/document-detail/TableOfContents";

export const documentContentPanelClassName =
  "note-toc-content rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

const tocClassName =
  "lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto";

type DocumentDetailLayoutProps = {
  hasHeadings: boolean;
  tocContentKey: string;
  contentElement: HTMLElement | null;
  header: ReactNode;
  contentPanelRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  formId?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer?: ReactNode;
  tocTitle?: string;
};

export function DocumentDetailLayout({
  hasHeadings,
  tocContentKey,
  contentElement,
  header,
  contentPanelRef,
  isEditing,
  formId,
  onSubmit,
  children,
  footer,
  tocTitle,
}: Readonly<DocumentDetailLayoutProps>) {
  const contentPanel = (
    <div ref={contentPanelRef} className={documentContentPanelClassName}>
      {children}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-start">
      {hasHeadings ? (
        <TableOfContents
          contentKey={tocContentKey}
          contentElement={contentElement}
          className={tocClassName}
          title={tocTitle}
        />
      ) : null}

      <div className="min-w-0 flex-1 space-y-6">
        {header}

        {isEditing && formId && onSubmit ? (
          <form id={formId} onSubmit={onSubmit} className="space-y-4">
            {contentPanel}
            {footer}
          </form>
        ) : (
          <>
            {contentPanel}
            {footer}
          </>
        )}
      </div>
    </div>
  );
}
