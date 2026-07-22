import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { MarkdownTablePaste } from "@/lib/tiptap/markdown-table-paste";

export function getRichTextExtensions(placeholder = "Write your note...") {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Highlight.configure({
      multicolor: false,
    }),
    Placeholder.configure({
      placeholder,
    }),
    TableKit.configure({
      table: {
        resizable: false,
      },
    }),
    MarkdownTablePaste,
  ];
}
