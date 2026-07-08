"use client";

import { useCallback, useMemo, useState } from "react";
import { getRichTextHeadings } from "@/lib/rich-text";

export function useNoteHeadings(content: string, enabled: boolean) {
  const [contentElement, setContentElement] = useState<HTMLElement | null>(
    null,
  );

  const contentRef = useCallback((node: HTMLDivElement | null) => {
    setContentElement(node);
  }, []);

  const hasHeadings = useMemo(() => {
    if (!enabled) {
      return false;
    }

    return getRichTextHeadings(content).length > 0;
  }, [content, enabled]);

  return { contentRef, contentElement, hasHeadings };
}
