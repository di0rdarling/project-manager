"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEditorState } from "@tiptap/react";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  BoldIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ItalicIcon,
  LinkIcon,
  PencilSquareIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { documentDetailToolbarButtonClassName } from "@/components/views/document-detail/DocumentDetailToolbarActions";
import { useEnhanceRichText } from "@/hooks/mutations/useEnhanceRichText";
import type { RichTextEnhanceAction } from "@/lib/prompts/rich-text-enhance-prompt";
import {
  prepareRichTextHtmlForDisplay,
  stripRichText,
} from "@/lib/rich-text";
import {
  bubbleMenuFloatingOptions,
  getBubbleMenuPlacement,
  getEditorSelectionHtml,
  getEditorSelectionRange,
} from "@/lib/tiptap/tiptap-selection";

type EnhancedRichTextEditorSelectionToolbarProps = {
  editor: Editor | null;
  onEnhanced: (html: string) => void;
};

type SelectionRange = {
  from: number;
  to: number;
};

type AiSelectionPreview = {
  html: string;
  range: SelectionRange;
  actionLabel: string;
};

type SelectionToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
};

function SelectionToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  ariaLabel,
  children,
  className,
}: SelectionToolbarButtonProps) {
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
      className={`inline-flex cursor-pointer items-center justify-center rounded-md p-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${activeClassName} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

const AI_SELECTION_OPTIONS: Array<{
  action: RichTextEnhanceAction;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    action: "polish",
    label: "Polish",
    icon: <PencilSquareIcon className="size-3.5" aria-hidden />,
  },
  {
    action: "shorten",
    label: "Shorten",
    icon: <ArrowsPointingInIcon className="size-3.5" aria-hidden />,
  },
  {
    action: "expand",
    label: "Expand",
    icon: <ArrowsPointingOutIcon className="size-3.5" aria-hidden />,
  },
];

const compactToolbarButtonClassName = `${documentDetailToolbarButtonClassName} inline-flex items-center gap-1`;

function AiSelectionPreviewPanel({
  preview,
  onAccept,
  onReject,
  onCopy,
}: {
  preview: AiSelectionPreview;
  onAccept: () => void;
  onReject: () => void;
  onCopy: () => void;
}) {
  const previewHtml = prepareRichTextHtmlForDisplay(preview.html);

  return (
    <div className="w-72 max-w-[calc(100vw-2rem)] space-y-2 p-1">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
          {preview.actionLabel} suggestion
        </p>
        <IconButton
          type="button"
          aria-label="Dismiss preview"
          onClick={onReject}
          className="rounded-md p-0.5"
        >
          <XMarkIcon className="size-3.5" aria-hidden />
        </IconButton>
      </div>

      <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
        <div
          className="tiptap-content text-xs text-zinc-800 dark:text-zinc-200"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          onClick={onAccept}
          className={compactToolbarButtonClassName}
        >
          <CheckIcon className="size-3.5" aria-hidden />
          Accept
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onReject}
          className={compactToolbarButtonClassName}
        >
          Reject
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCopy}
          className={compactToolbarButtonClassName}
        >
          <ClipboardDocumentIcon className="size-3.5" aria-hidden />
          Copy
        </Button>
      </div>
    </div>
  );
}

function createSelectionVirtualElement(editor: Editor, range: SelectionRange) {
  const start = editor.view.coordsAtPos(range.from);
  const end = editor.view.coordsAtPos(range.to);

  return {
    getBoundingClientRect: () =>
      DOMRect.fromRect({
        x: start.left,
        y: start.top,
        width: Math.max(end.right - start.left, 0),
        height: Math.max(end.bottom - start.top, 0),
      }),
  };
}

export function EnhancedRichTextEditorSelectionToolbar({
  editor,
  onEnhanced,
}: EnhancedRichTextEditorSelectionToolbarProps) {
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiSelectionPreview | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<SelectionRange>({ from: 0, to: 0 });
  const pendingActionRef = useRef<RichTextEnhanceAction | null>(null);
  const aiPreviewRef = useRef<AiSelectionPreview | null>(null);

  useEffect(() => {
    aiPreviewRef.current = aiPreview;
  }, [aiPreview]);

  const enhanceRichTextMutation = useEnhanceRichText({
    onSuccess: (result) => {
      const action = pendingActionRef.current;
      const actionLabel =
        AI_SELECTION_OPTIONS.find((option) => option.action === action)?.label ??
        "AI";

      setAiPreview({
        html: result.html,
        range: selectionRangeRef.current,
        actionLabel,
      });
      pendingActionRef.current = null;
      setIsAskAiOpen(false);
    },
    onError: (error) => {
      pendingActionRef.current = null;
      toast.error(error.message || "Failed to enhance selection.");
    },
  });

  const isProcessing = enhanceRichTextMutation.isPending;
  const placement = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor ? getBubbleMenuPlacement(currentEditor) : "top",
  }) ?? "top";

  const bubbleMenuOptions = useMemo(
    () => ({
      ...bubbleMenuFloatingOptions,
      placement: aiPreview ? "bottom" : placement,
      onHide: () => {
        setIsLinkEditorOpen(false);
        setIsAskAiOpen(false);
        setAiPreview(null);
        pendingActionRef.current = null;
      },
    }),
    [aiPreview, placement],
  );

  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return null;
      }

      return {
        isBold: currentEditor.isActive("bold"),
        isItalic: currentEditor.isActive("italic"),
        isLink: currentEditor.isActive("link"),
        hasSelection: !currentEditor.state.selection.empty,
      };
    },
  });

  useEffect(() => {
    if (!isAskAiOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setIsAskAiOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAskAiOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAskAiOpen]);

  useEffect(() => {
    if (!aiPreview) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAiPreview(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiPreview]);

  if (!editor || !state) {
    return null;
  }

  function clearAiPreview() {
    setAiPreview(null);
    pendingActionRef.current = null;
  }

  function closePanels() {
    setIsLinkEditorOpen(false);
    setIsAskAiOpen(false);
  }

  function openLinkEditor() {
    clearAiPreview();
    setIsAskAiOpen(false);
    setLinkUrl(editor?.getAttributes("link").href ?? "");
    setIsLinkEditorOpen(true);
  }

  function applyLink() {
    if (!editor) {
      return;
    }

    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkEditorOpen(false);
      return;
    }

    const href = /^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setIsLinkEditorOpen(false);
  }

  function handleAskAiAction(action: RichTextEnhanceAction) {
    if (!editor || isProcessing || aiPreview) {
      return;
    }

    const selectedHtml = getEditorSelectionHtml(editor);
    if (!selectedHtml) {
      return;
    }

    selectionRangeRef.current = getEditorSelectionRange(editor);
    pendingActionRef.current = action;
    enhanceRichTextMutation.mutate({
      html: selectedHtml,
      action,
    });
  }

  function acceptAiPreview() {
    if (!editor || !aiPreview) {
      return;
    }

    const { from, to } = aiPreview.range;
    editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, aiPreview.html)
      .run();

    onEnhanced(editor.getHTML());
    clearAiPreview();
    toast.success("Selection updated with AI.");
  }

  function rejectAiPreview() {
    clearAiPreview();
  }

  async function copyAiPreview() {
    if (!aiPreview) {
      return;
    }

    try {
      await navigator.clipboard.writeText(stripRichText(aiPreview.html));
      toast.success("Suggestion copied to clipboard.");
    } catch {
      toast.error("Failed to copy suggestion.");
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      className="z-30"
      shouldShow={({ editor: currentEditor, state: editorState }) => {
        if (aiPreviewRef.current) {
          return currentEditor.isEditable;
        }

        return currentEditor.isEditable && !editorState.selection.empty;
      }}
      getReferencedVirtualElement={
        aiPreview
          ? () => createSelectionVirtualElement(editor, aiPreview.range)
          : undefined
      }
      options={bubbleMenuOptions}
    >
      <div
        ref={toolbarRef}
        className="rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
      >
        {aiPreview ? (
          <AiSelectionPreviewPanel
            preview={aiPreview}
            onAccept={acceptAiPreview}
            onReject={rejectAiPreview}
            onCopy={copyAiPreview}
          />
        ) : isLinkEditorOpen ? (
          <div className="flex items-center gap-1 px-1 py-0.5">
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
                  setIsLinkEditorOpen(false);
                }
              }}
              placeholder="Paste a link"
              aria-label="Link URL"
              className="w-44 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyLink}
              className={documentDetailToolbarButtonClassName}
            >
              Apply
            </Button>
            {state.isLink ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setIsLinkEditorOpen(false);
                }}
                className={documentDetailToolbarButtonClassName}
              >
                Remove
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-0.5 px-1 py-0.5">
            <SelectionToolbarButton
              ariaLabel="Bold"
              isActive={state.isBold}
              onClick={() => {
                closePanels();
                editor.chain().focus().toggleBold().run();
              }}
            >
              <BoldIcon className="size-3.5" />
            </SelectionToolbarButton>
            <SelectionToolbarButton
              ariaLabel="Italic"
              isActive={state.isItalic}
              onClick={() => {
                closePanels();
                editor.chain().focus().toggleItalic().run();
              }}
            >
              <ItalicIcon className="size-3.5" />
            </SelectionToolbarButton>
            <SelectionToolbarButton
              ariaLabel="Link"
              isActive={state.isLink}
              onClick={openLinkEditor}
            >
              <LinkIcon className="size-3.5" />
            </SelectionToolbarButton>

            <div
              aria-hidden
              className="mx-0.5 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700"
            />

            <div className="relative">
              <SelectionToolbarButton
                ariaLabel="Ask AI"
                disabled={!state.hasSelection || isProcessing}
                onClick={() => {
                  setIsLinkEditorOpen(false);
                  setIsAskAiOpen((open) => !open);
                }}
                className="gap-1 px-1.5 text-xs font-medium"
              >
                {isProcessing ? (
                  <ArrowPathIcon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon className="size-3.5" aria-hidden />
                )}
                <span>{isProcessing ? "..." : "Ask AI"}</span>
              </SelectionToolbarButton>

              {isAskAiOpen ? (
                <div
                  role="menu"
                  aria-label="AI options for selection"
                  className="absolute bottom-full left-0 z-10 mb-1 min-w-32 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {AI_SELECTION_OPTIONS.map((option) => (
                    <button
                      key={option.action}
                      type="button"
                      role="menuitem"
                      disabled={isProcessing}
                      onClick={() => handleAskAiAction(option.action)}
                      className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {option.icon}
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
