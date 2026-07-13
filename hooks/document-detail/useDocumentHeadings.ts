"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { getRichTextHeadings } from "@/lib/rich-text";

export function useDocumentHeadings(content: string) {
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const contentPanelRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => getRichTextHeadings(content), [content]);
  const headingsKey = useMemo(
    () => headings.map((heading) => `${heading.level}:${heading.text}`).join("|"),
    [headings],
  );

  const syncReadContentElement = useCallback(() => {
    if (contentPanelRef.current) {
      setContentElement(contentPanelRef.current);
    }
  }, []);

  return {
    headings,
    hasHeadings: headings.length > 0,
    headingsKey,
    contentElement,
    setContentElement,
    contentPanelRef,
    syncReadContentElement,
  };
}
