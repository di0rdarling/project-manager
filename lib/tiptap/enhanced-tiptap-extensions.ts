import Link from "@tiptap/extension-link";
import { getRichTextExtensions } from "@/lib/tiptap/tiptap-extensions";

export function getEnhancedRichTextExtensions(placeholder = "Write your note...") {
  return [
    ...getRichTextExtensions(placeholder),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: "https",
    }),
  ];
}
