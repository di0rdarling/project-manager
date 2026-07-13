import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

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
  ];
}
