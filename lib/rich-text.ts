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

export type RichTextHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

function createUniqueHeadingId(text: string, usedIds: Set<string>): string {
  const baseId = slugifyHeading(text);
  let id = baseId;
  let counter = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter += 1;
  }

  usedIds.add(id);
  return id;
}

function stripMarkdownInlineFormatting(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

function extractHeadingsFromHtml(html: string): RichTextHeading[] {
  const headings: RichTextHeading[] = [];
  const usedIds = new Set<string>();
  const regex = /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match = regex.exec(html);

  while (match) {
    const level = Number(match[1]) as 1 | 2 | 3;
    const text = stripRichText(match[3]);

    if (text) {
      headings.push({
        id: createUniqueHeadingId(text, usedIds),
        text,
        level,
      });
    }

    match = regex.exec(html);
  }

  return headings;
}

function extractHeadingsFromMarkdown(markdown: string): RichTextHeading[] {
  const headings: RichTextHeading[] = [];
  const usedIds = new Set<string>();
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match = regex.exec(markdown);

  while (match) {
    const level = match[1].length as 1 | 2 | 3;
    const text = stripMarkdownInlineFormatting(match[2]);

    if (text) {
      headings.push({
        id: createUniqueHeadingId(text, usedIds),
        text,
        level,
      });
    }

    match = regex.exec(markdown);
  }

  return headings;
}

export function getRichTextHeadings(content: string): RichTextHeading[] {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  const htmlHeadings = extractHeadingsFromHtml(trimmed);
  if (htmlHeadings.length > 0) {
    return htmlHeadings;
  }

  const renderable = getRenderableRichTextContent(content);

  if (renderable.type === "markdown") {
    return extractHeadingsFromMarkdown(renderable.content);
  }

  return htmlHeadings;
}

export function annotateRichTextHeadings(
  content: string,
  headings: RichTextHeading[],
): string {
  const renderable = getRenderableRichTextContent(content);

  if (renderable.type === "markdown") {
    return renderable.content;
  }

  let headingIndex = 0;

  return renderable.content.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attrs: string, inner: string) => {
      while (headingIndex < headings.length) {
        const heading = headings[headingIndex];
        headingIndex += 1;

        if (Number(level) !== heading.level) {
          continue;
        }

        const text = stripRichText(inner);
        if (!text) {
          continue;
        }

        if (/\bid\s*=/.test(attrs)) {
          return match;
        }

        return `<h${level}${attrs} id="${heading.id}" class="scroll-mt-24">${inner}</h${level}>`;
      }

      return match;
    },
  );
}
