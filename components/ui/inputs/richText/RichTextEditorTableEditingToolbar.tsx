"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ToolbarButton } from "@/components/ui/inputs/richText/RichTextToolbarControls";

type RichTextEditorTableEditingToolbarProps = {
  editor: Editor;
};

export function RichTextEditorTableEditingToolbar({
  editor,
}: RichTextEditorTableEditingToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isTable: currentEditor.isActive("table"),
      canAddColumn: currentEditor.can().chain().focus().addColumnAfter().run(),
      canAddRow: currentEditor.can().chain().focus().addRowAfter().run(),
      canDeleteColumn: currentEditor.can().chain().focus().deleteColumn().run(),
      canDeleteRow: currentEditor.can().chain().focus().deleteRow().run(),
      canDeleteTable: currentEditor.can().chain().focus().deleteTable().run(),
    }),
  });

  if (!state?.isTable) {
    return null;
  }

  return (
    <>
      <ToolbarButton
        ariaLabel="Add column"
        title="Add column"
        disabled={!state.canAddColumn}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <span className="px-0.5 text-[10px] font-semibold leading-none">
          +Col
        </span>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Add row"
        title="Add row"
        disabled={!state.canAddRow}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <span className="px-0.5 text-[10px] font-semibold leading-none">
          +Row
        </span>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Delete column"
        title="Delete column"
        disabled={!state.canDeleteColumn}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <span className="px-0.5 text-[10px] font-semibold leading-none">
          −Col
        </span>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Delete row"
        title="Delete row"
        disabled={!state.canDeleteRow}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <span className="px-0.5 text-[10px] font-semibold leading-none">
          −Row
        </span>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Delete table"
        title="Delete table"
        disabled={!state.canDeleteTable}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <TrashIcon className="size-4" />
      </ToolbarButton>
    </>
  );
}
