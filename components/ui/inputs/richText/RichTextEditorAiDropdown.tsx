"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useEnhanceRichText } from "@/hooks/mutations/useEnhanceRichText";
import type { RichTextEnhanceAction } from "@/lib/prompts/rich-text-enhance-prompt";
import { isRichTextEmpty } from "@/lib/rich-text";

type RichTextEditorAiDropdownProps = {
  editor: Editor | null;
  onEnhanced: (html: string) => void;
};

type AiMenuOption = {
  action: RichTextEnhanceAction;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const AI_MENU_OPTIONS: AiMenuOption[] = [
  {
    action: "shorten",
    label: "Shorten & polish",
    description: "Make it shorter and fix grammar and spelling",
    icon: <ArrowsPointingInIcon className="size-4" aria-hidden />,
  },
  {
    action: "expand",
    label: "Expand",
    description: "Make it longer and more detailed",
    icon: <ArrowsPointingOutIcon className="size-4" aria-hidden />,
  },
];

export function RichTextEditorAiDropdown({
  editor,
  onEnhanced,
}: RichTextEditorAiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const enhanceRichTextMutation = useEnhanceRichText({
    onSuccess: (result) => {
      if (editor && !editor.isDestroyed) {
        editor.commands.setContent(result.html, { emitUpdate: true });
      }

      onEnhanced(result.html);
      setIsOpen(false);
      toast.success("Text updated with AI.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enhance text.");
    },
  });

  const isProcessing = enhanceRichTextMutation.isPending;
  const currentHtml = editor?.getHTML() ?? "";
  const isEmpty = isRichTextEmpty(currentHtml);
  const isDisabled = !editor || isEmpty || isProcessing;

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

  function handleActionSelect(action: RichTextEnhanceAction) {
    if (!editor || isEmpty || isProcessing) {
      return;
    }

    enhanceRichTextMutation.mutate({
      html: editor.getHTML(),
      action,
    });
  }

  return (
    <div
      ref={containerRef}
      className="relative border-t border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="AI writing options"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        {isProcessing ? (
          <ArrowPathIcon className="size-4 animate-spin" aria-hidden />
        ) : (
          <SparklesIcon className="size-4" aria-hidden />
        )}
        <span>{isProcessing ? "Enhancing..." : "AI"}</span>
        <ChevronDownIcon
          className={`size-3.5 transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="AI writing options"
          className="absolute bottom-full left-2 z-10 mb-1 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          {AI_MENU_OPTIONS.map((option) => (
            <button
              key={option.action}
              type="button"
              role="menuitem"
              disabled={isProcessing}
              onClick={() => handleActionSelect(option.action)}
              className="flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900"
            >
              <span className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {option.label}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
