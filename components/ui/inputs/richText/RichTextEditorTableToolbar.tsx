"use client";

import type { Editor } from "@tiptap/core";
import { RichTextEditorInsertTableToolbar } from "@/components/ui/inputs/richText/RichTextEditorInsertTableToolbar";
import { RichTextEditorTableEditingToolbar } from "@/components/ui/inputs/richText/RichTextEditorTableEditingToolbar";

type RichTextEditorTableToolbarProps = {
  editor: Editor;
};

export function RichTextEditorTableToolbar({
  editor,
}: RichTextEditorTableToolbarProps) {
  return (
    <>
      <RichTextEditorInsertTableToolbar editor={editor} />
      <RichTextEditorTableEditingToolbar editor={editor} />
    </>
  );
}
