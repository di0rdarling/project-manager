import type { Editor } from "@tiptap/core";
import {
  containsMarkdownTable,
  convertMarkdownPlainTextWithTablesToHtml,
  convertMarkdownTableParagraphsInHtml,
  unwrapMarkdownTableWrappers,
} from "@/lib/rich-text";

function clipboardHasHtmlTable(html: string): boolean {
  return /<table[\s>]/i.test(html);
}

/**
 * Convert pasted markdown pipe tables (or HTML paragraphs of pipe rows)
 * into real TipTap table nodes. Returns true when the paste was handled.
 */
export function handleRichTextPaste(
  editor: Editor,
  event: ClipboardEvent,
): boolean {
  const clipboard = event.clipboardData;
  if (!clipboard) {
    return false;
  }

  const plainText = clipboard.getData("text/plain");
  if (plainText && containsMarkdownTable(plainText)) {
    const html = convertMarkdownPlainTextWithTablesToHtml(plainText);
    if (html) {
      editor.commands.insertContent(html);
      return true;
    }
  }

  const html = clipboard.getData("text/html");
  if (!html || clipboardHasHtmlTable(html)) {
    return false;
  }

  const converted = convertMarkdownTableParagraphsInHtml(html);
  if (converted === html) {
    return false;
  }

  editor.commands.insertContent(unwrapMarkdownTableWrappers(converted));
  return true;
}
