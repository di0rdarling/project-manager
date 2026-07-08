"use client";

import { useEffect, useRef, useState } from "react";
import tocbot from "tocbot";
import {
  assignDomHeadingIds,
  createNoteTocClickHandler,
} from "@/lib/note-toc-scroll";

type NoteTableOfContentsProps = {
  isOpen: boolean;
  contentKey: string;
  contentElement: HTMLElement | null;
};

export function NoteTableOfContents({
  isOpen,
  contentKey,
  contentElement,
}: Readonly<NoteTableOfContentsProps>) {
  const tocRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!isOpen || !tocRef.current || !contentElement) {
      tocbot.destroy();
      setIsEmpty(false);
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

      setIsEmpty((tocRef.current?.querySelector("li") ?? null) === null);
    });

    return () => {
      cancelAnimationFrame(frame);
      tocbot.destroy();
    };
  }, [isOpen, contentKey, contentElement]);

  return (
    <nav
      id="note-table-of-contents"
      aria-label="Table of contents"
      hidden={!isOpen}
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Table of contents
      </h2>
      {isEmpty ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No headings in this note.
        </p>
      ) : (
        <div ref={tocRef} className="note-toc" />
      )}
    </nav>
  );
}
