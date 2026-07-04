"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  ChatBubbleBottomCenterTextIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  PaintBrushIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "@heroicons/react/24/outline";

type RichTextEditorToolbarProps = {
  editor: Editor | null;
};

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
};

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  ariaLabel,
  children,
}: ToolbarButtonProps) {
  const activeClassName = isActive
    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${activeClassName}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      aria-hidden
      className="mx-1 hidden h-6 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
    />
  );
}

function HeadingButton({
  level,
  isActive,
  onClick,
}: {
  level: 1 | 2 | 3;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Heading ${level}`}
      aria-pressed={isActive}
      className={`inline-flex min-w-8 cursor-pointer items-center justify-center rounded-md px-1.5 py-1 text-xs font-semibold transition ${
        isActive
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      H{level}
    </button>
  );
}

export function RichTextEditorToolbar({ editor }: RichTextEditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return null;
      }

      return {
        isBold: currentEditor.isActive("bold"),
        isItalic: currentEditor.isActive("italic"),
        isUnderline: currentEditor.isActive("underline"),
        isStrike: currentEditor.isActive("strike"),
        isHighlight: currentEditor.isActive("highlight"),
        isBulletList: currentEditor.isActive("bulletList"),
        isOrderedList: currentEditor.isActive("orderedList"),
        isBlockquote: currentEditor.isActive("blockquote"),
        isHeading1: currentEditor.isActive("heading", { level: 1 }),
        isHeading2: currentEditor.isActive("heading", { level: 2 }),
        isHeading3: currentEditor.isActive("heading", { level: 3 }),
        canUndo: currentEditor.can().chain().focus().undo().run(),
        canRedo: currentEditor.can().chain().focus().redo().run(),
      };
    },
  });

  if (!editor || !state) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      <ToolbarButton
        ariaLabel="Bold"
        isActive={state.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Italic"
        isActive={state.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Underline"
        isActive={state.isUnderline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Strikethrough"
        isActive={state.isStrike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Highlight"
        isActive={state.isHighlight}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <PaintBrushIcon className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <HeadingButton
        level={1}
        isActive={state.isHeading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <HeadingButton
        level={2}
        isActive={state.isHeading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <HeadingButton
        level={3}
        isActive={state.isHeading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        ariaLabel="Bullet list"
        isActive={state.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBulletIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Numbered list"
        isActive={state.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <NumberedListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Quote"
        isActive={state.isBlockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <ChatBubbleBottomCenterTextIcon className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        ariaLabel="Undo"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <ArrowUturnLeftIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Redo"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <ArrowUturnRightIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
}
