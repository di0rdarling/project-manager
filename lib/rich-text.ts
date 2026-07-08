export function stripRichText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function isRichTextEmpty(html: string): boolean {
  return stripRichText(html).length === 0;
}

export function getRichTextPreview(html: string, maxLength = 80): string {
  const plain = stripRichText(html);
  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength)}...`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<\/li>\s*<li[^>]*>/gi, "\n")
      .replace(/<\/h[1-6]>\s*<h[1-6][^>]*>/gi, "\n\n")
      .replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content.trim());
}

export function hasFencedCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```/.test(content);
}

export type RenderableRichTextContent =
  | { type: "html"; content: string }
  | { type: "markdown"; content: string };

export function getRenderableRichTextContent(
  content: string,
): RenderableRichTextContent {
  const trimmed = content.trim();

  if (!trimmed) {
    return { type: "html", content: "" };
  }

  const isHtml = isHtmlContent(trimmed);
  const hasFences = hasFencedCodeBlocks(trimmed);
  const hasPreBlocks = /<pre[\s>]/i.test(trimmed);

  if (!isHtml || (hasFences && !hasPreBlocks)) {
    return {
      type: "markdown",
      content: isHtml ? htmlToPlainText(trimmed) : trimmed,
    };
  }

  return { type: "html", content: trimmed };
}
