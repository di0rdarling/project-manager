"use client";

import { useCallback, useMemo, useState } from "react";
import { getRichTextHeadings } from "@/lib/rich-text";

export function useNoteHeadings(content: string) {
  const [contentElement, setContentElement] = useState<HTMLElement | null>(
    null,
  );

  const readContentRef = useCallback((node: HTMLDivElement | null) => {
    setContentElement(node);
  }, []);

  const headings = useMemo(() => getRichTextHeadings(content), [content]);
  const headingsKey = useMemo(
    () => headings.map((heading) => `${heading.level}:${heading.text}`).join("|"),
    [headings],
  );

  return {
    headings,
    hasHeadings: headings.length > 0,
    headingsKey,
    contentElement,
    setContentElement,
    readContentRef,
  };
}
