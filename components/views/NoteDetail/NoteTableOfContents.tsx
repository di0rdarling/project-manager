"use client";

import { useEffect, useRef } from "react";
import tocbot from "tocbot";
import {
  assignDomHeadingIds,
  createNoteTocClickHandler,
} from "@/lib/note-toc-scroll";

type NoteTableOfContentsProps = {
  contentKey: string;
  contentElement: HTMLElement | null;
  className?: string;
};

export function NoteTableOfContents({
  contentKey,
  contentElement,
  className,
}: Readonly<NoteTableOfContentsProps>) {
  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tocRef.current || !contentElement) {
      tocbot.destroy();
      return;
    }

    const frame = requestAnimationFrame(() => {
      assignDomHeadingIds(contentElement);

      tocbot.init({
        tocElement: tocRef.current ?? undefined,
        contentElement,
        headingSelector: "h1, h2, h3",
        hasInnerContainers: true,
        orderedList: false,
        scrollContainer: "main",
        scrollSmooth: false,
        headingsOffset: 24,
        linkClass: "note-toc-link",
        activeLinkClass: "note-toc-link-active",
        listClass: "note-toc-list",
        listItemClass: "note-toc-list-item",
        activeListItemClass: "note-toc-list-item-active",
        onClick: createNoteTocClickHandler(contentElement),
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      tocbot.destroy();
    };
  }, [contentKey, contentElement]);

  return (
    <nav
      aria-label="Table of contents"
      className={
        className
          ? `rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${className}`
          : "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      }
    >
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Table of contents
      </h2>
      <div ref={tocRef} className="note-toc" />
    </nav>
  );
}
