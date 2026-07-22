"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { TableCellsIcon } from "@heroicons/react/24/outline";
import { ToolbarButton } from "@/components/ui/inputs/richText/RichTextToolbarControls";

type RichTextEditorInsertTableToolbarProps = {
  editor: Editor;
};

export function RichTextEditorInsertTableToolbar({
  editor,
}: RichTextEditorInsertTableToolbarProps) {
  const isTable = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor.isActive("table"),
  });

  return (
    <ToolbarButton
      ariaLabel="Insert table"
      title="Insert table"
      isActive={isTable ?? false}
      onClick={() =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      }
    >
      <TableCellsIcon className="size-4" />
    </ToolbarButton>
  );
}
