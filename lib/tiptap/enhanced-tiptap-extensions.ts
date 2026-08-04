import { getRichTextExtensions } from "@/lib/tiptap/tiptap-extensions";

export function getEnhancedRichTextExtensions(placeholder = "Write your note...") {
  return getRichTextExtensions(placeholder);
}
