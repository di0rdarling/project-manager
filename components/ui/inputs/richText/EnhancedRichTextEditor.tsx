"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { getEnhancedRichTextExtensions } from "@/lib/tiptap/enhanced-tiptap-extensions";
import { RichTextEditorAiDropdown } from "./RichTextEditorAiDropdown";
import { EnhancedRichTextEditorSelectionToolbar } from "./EnhancedRichTextEditorSelectionToolbar";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";

type EnhancedRichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onContentElementChange?: (element: HTMLElement | null) => void;
  hideLabel?: boolean;
  variant?: "default" | "embedded";
  toolbarActions?: React.ReactNode;
};

export function EnhancedRichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder = "Write your note...",
  onContentElementChange,
  hideLabel = false,
  variant = "default",
  toolbarActions,
}: EnhancedRichTextEditorProps) {
  const isEmbedded = variant === "embedded";
  const editor = useEditor({
    extensions: getEnhancedRichTextExtensions(placeholder),
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        class: "tiptap-editor",
        ...(hideLabel
          ? { "aria-label": label }
          : { "aria-labelledby": `${id}-label` }),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!onContentElementChange) {
      return undefined;
    }

    onContentElementChange(
      editor && !editor.isDestroyed ? (editor.view.dom as HTMLElement) : null,
    );

    return () => {
      onContentElementChange(null);
    };
  }, [editor, onContentElementChange]);

  return (
    <div className={isEmbedded ? undefined : "space-y-2"}>
      {hideLabel ? null : (
        <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
      )}
      <div
        className={
          isEmbedded
            ? undefined
            : "rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-400"
        }
      >
        <div
          className={
            isEmbedded
              ? "sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/95"
              : "sticky top-0 z-20 flex items-start justify-between gap-3 rounded-t-lg border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/95"
          }
        >
          <div className="min-w-0 flex-1">
            <RichTextEditorToolbar editor={editor} />
          </div>
          {toolbarActions ? (
            <div className="flex shrink-0 items-center gap-1.5 px-2 py-1">
              {toolbarActions}
            </div>
          ) : null}
        </div>
        <div className={isEmbedded ? "p-4" : undefined}>
          <EditorContent editor={editor} />
          <EnhancedRichTextEditorSelectionToolbar
            editor={editor}
            onEnhanced={onChange}
          />
        </div>
        <RichTextEditorAiDropdown editor={editor} onEnhanced={onChange} />
      </div>
    </div>
  );
}
