"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { ToolbarButton } from "@/components/ui/inputs/richText/RichTextToolbarControls";

type RichTextEditorLinkToolbarProps = {
  editor: Editor;
};

function normalizeLinkUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  return /^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
}

export function RichTextEditorLinkToolbar({
  editor,
}: RichTextEditorLinkToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const isLink = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor.isActive("link"),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openLinkEditor() {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setIsOpen(true);
  }

  function applyLink() {
    const href = normalizeLinkUrl(linkUrl);

    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsOpen(false);
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setIsOpen(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <ToolbarButton
        ariaLabel="Link"
        title="Link"
        isActive={isLink ?? false}
        onClick={openLinkEditor}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>

      {isOpen ? (
        <div className="absolute left-0 top-full z-30 mt-1 flex min-w-64 items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setIsOpen(false);
              }
            }}
            placeholder="Paste a link"
            aria-label="Link URL"
            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            autoFocus
          />
          <button
            type="button"
            onClick={applyLink}
            className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Apply
          </button>
          {isLink ? (
            <button
              type="button"
              onClick={removeLink}
              className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
