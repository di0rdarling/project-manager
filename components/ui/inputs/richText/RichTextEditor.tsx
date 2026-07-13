"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { getRichTextExtensions } from "@/lib/tiptap/tiptap-extensions";
import { RichTextEditorAiDropdown } from "./RichTextEditorAiDropdown";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";

type RichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder = "Write your note...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: getRichTextExtensions(placeholder),
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        class: "tiptap-editor",
        "aria-labelledby": `${id}-label`,
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

  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-400">
        <RichTextEditorToolbar editor={editor} />
        <EditorContent editor={editor} />
        <RichTextEditorAiDropdown editor={editor} onEnhanced={onChange} />
      </div>
    </div>
  );
}
