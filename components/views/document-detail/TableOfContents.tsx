"use client";

import { useEffect, useRef, useState } from "react";
import type { RichTextHeading } from "@/lib/rich-text";
import {
  getActiveNoteHeadingIndex,
  getNoteHeadingElements,
  getNoteHeadingScrollOffset,
  scrollToNoteHeadingElement,
} from "@/lib/note-toc-scroll";

type TableOfContentsProps = {
  contentKey: string;
  contentElement: HTMLElement | null;
  headings: RichTextHeading[];
  isEditing?: boolean;
  className?: string;
  title?: string;
};

export function TableOfContents({
  contentKey,
  contentElement,
  headings,
  isEditing = false,
  className,
  title = "Table of contents",
}: Readonly<TableOfContentsProps>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const headingElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    let frame = 0;

    if (!contentElement || headings.length === 0) {
      headingElementsRef.current = [];
      frame = requestAnimationFrame(() => setActiveIndex(-1));
      return () => cancelAnimationFrame(frame);
    }

    const scrollContainer = document.querySelector("main");
    const offset = getNoteHeadingScrollOffset(isEditing);

    function updateActiveHeading() {
      headingElementsRef.current = getNoteHeadingElements(contentElement!);
      setActiveIndex(getActiveNoteHeadingIndex(headingElementsRef.current, offset));
    }

    function handleScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveHeading);
    }

    // Wait a frame for the content (and, in edit mode, the rich text
    // editor) to finish rendering before measuring heading positions.
    frame = requestAnimationFrame(updateActiveHeading);

    scrollContainer?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frame);
      scrollContainer?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [contentKey, contentElement, headings.length, isEditing]);

  function handleHeadingClick(index: number) {
    if (!contentElement) {
      return;
    }

    const headingElements = getNoteHeadingElements(contentElement);
    const heading = headingElements[index];

    if (!heading) {
      return;
    }

    scrollToNoteHeadingElement(heading, getNoteHeadingScrollOffset(isEditing));
  }

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={title}
      className={
        className
          ? `rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${className}`
          : "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      }
    >
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <ul className="note-toc-list">
        {headings.map((heading, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={heading.id}
              className={`note-toc-list-item${isActive ? " note-toc-list-item-active" : ""}`}
            >
              <a
                href={`#${heading.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleHeadingClick(index);
                }}
                className={`note-toc-link${isActive ? " note-toc-link-active" : ""}`}
                style={{ paddingLeft: `${(heading.level - 1) * 0.75 + 0.75}rem` }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
