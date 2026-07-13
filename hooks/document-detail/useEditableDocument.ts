"use client";

import { useCallback, useEffect, useState } from "react";
import { isRichTextEmpty } from "@/lib/rich-text";
import { useDocumentHeadings } from "@/hooks/document-detail/useDocumentHeadings";

export type EditableDocument = {
  title: string;
  content: string;
};

type UseEditableDocumentOptions = {
  canEdit?: boolean;
  titleRequiredMessage?: string;
  contentRequiredMessage?: string;
};

export function useEditableDocument(
  document: EditableDocument | null | undefined,
  {
    canEdit = true,
    titleRequiredMessage = "Title is required",
    contentRequiredMessage = "Content is required",
  }: UseEditableDocumentOptions = {},
) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editorReadyKey, setEditorReadyKey] = useState(0);
  const documentHeadings = useDocumentHeadings(content);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setValidationError(null);
    }
  }, [document]);

  const notifyEditorReady = useCallback(() => {
    requestAnimationFrame(() => {
      documentHeadings.syncContentPanelElement();
      setEditorReadyKey((key) => key + 1);
    });
  }, [documentHeadings.syncContentPanelElement]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        documentHeadings.syncContentPanelElement();
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isEditing, documentHeadings.headingsKey, documentHeadings.syncContentPanelElement]);

  function startEditing() {
    if (!document || !canEdit) {
      return;
    }

    setTitle(document.title);
    setContent(document.content);
    setValidationError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!document) {
      return;
    }

    setTitle(document.title);
    setContent(document.content);
    setValidationError(null);
    setIsEditing(false);
  }

  function validate(): string | null {
    if (!title.trim()) {
      return titleRequiredMessage;
    }

    if (isRichTextEmpty(content)) {
      return contentRequiredMessage;
    }

    return null;
  }

  function clearValidationError() {
    setValidationError(null);
  }

  return {
    isEditing,
    setIsEditing,
    title,
    setTitle,
    content,
    setContent,
    validationError,
    setValidationError,
    startEditing,
    cancelEditing,
    validate,
    clearValidationError,
    editorReadyKey,
    notifyEditorReady,
    ...documentHeadings,
  };
}
