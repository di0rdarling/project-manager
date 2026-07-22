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

function stripInlineHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, "").trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MARKDOWN_TABLE_ROW_PATTERN = /^\|.+\|$/;
const MARKDOWN_TABLE_SEPARATOR_PATTERN = /^\|[-:|\s]+\|$/;

export function isMarkdownTableRow(text: string): boolean {
  const trimmed = text.trim();
  return MARKDOWN_TABLE_ROW_PATTERN.test(trimmed);
}

export function isMarkdownTableSeparator(text: string): boolean {
  const trimmed = text.trim();
  return MARKDOWN_TABLE_SEPARATOR_PATTERN.test(trimmed);
}

function parseMarkdownTableCells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function buildHtmlTable(rows: string[], options?: { wrap?: boolean }): string {
  const headerCells = parseMarkdownTableCells(rows[0]);
  const bodyRows = rows.slice(2).map(parseMarkdownTableCells);
  const columnCount = Math.max(
    headerCells.length,
    ...bodyRows.map((cells) => cells.length),
    1,
  );

  const padCells = (cells: string[]) => {
    const padded = cells.slice(0, columnCount);
    while (padded.length < columnCount) {
      padded.push("");
    }
    return padded;
  };

  const headerHtml = padCells(headerCells)
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("");
  const bodyHtml = bodyRows
    .map(
      (cells) =>
        `<tr>${padCells(cells)
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const table = `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;

  if (options?.wrap === false) {
    return table;
  }

  return `<div class="markdown-table-wrapper">${table}</div>`;
}

export function containsMarkdownTable(text: string): boolean {
  const lines = normalizeMarkdownTables(text).split("\n");

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (
      isMarkdownTableRow(lines[index]) &&
      isMarkdownTableSeparator(lines[index + 1])
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Convert plain text that includes GFM pipe tables into HTML TipTap can insert.
 * Returns null when no markdown table is present.
 */
export function convertMarkdownPlainTextWithTablesToHtml(
  text: string,
): string | null {
  if (!containsMarkdownTable(text)) {
    return null;
  }

  const lines = normalizeMarkdownTables(text).split("\n");
  const parts: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isMarkdownTableRow(line)) {
      const tableLines: string[] = [];

      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        tableLines.push(lines[index].trim());
        index += 1;
      }

      if (
        tableLines.length >= 2 &&
        isMarkdownTableSeparator(tableLines[1])
      ) {
        parts.push(buildHtmlTable(tableLines, { wrap: false }));
        continue;
      }

      tableLines.forEach((tableLine) => {
        parts.push(`<p>${escapeHtml(tableLine)}</p>`);
      });
      continue;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    parts.push(`<p>${escapeHtml(line)}</p>`);
    index += 1;
  }

  return parts.join("") || null;
}

export function unwrapMarkdownTableWrappers(html: string): string {
  return html.replace(
    /<div class="markdown-table-wrapper">([\s\S]*?)<\/div>/gi,
    "$1",
  );
}

export function normalizeMarkdownTables(markdown: string): string {
  const lines = markdown.split("\n");
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const previousLine = normalized.at(-1);

    if (
      line.trim() === "" &&
      previousLine &&
      isMarkdownTableRow(previousLine) &&
      index + 1 < lines.length &&
      isMarkdownTableRow(lines[index + 1])
    ) {
      continue;
    }

    normalized.push(line);
  }

  return normalized.join("\n");
}

export function convertMarkdownTableParagraphsInHtml(html: string): string {
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  type Segment =
    | { type: "paragraph"; raw: string; text: string }
    | { type: "other"; raw: string };

  const segments: Segment[] = [];
  let lastIndex = 0;
  let match = paragraphRegex.exec(html);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({ type: "other", raw: html.slice(lastIndex, match.index) });
    }

    segments.push({
      type: "paragraph",
      raw: match[0],
      text: stripInlineHtml(match[1]),
    });
    lastIndex = match.index + match[0].length;
    match = paragraphRegex.exec(html);
  }

  if (lastIndex < html.length) {
    segments.push({ type: "other", raw: html.slice(lastIndex) });
  }

  const result: string[] = [];
  let index = 0;

  while (index < segments.length) {
    const segment = segments[index];

    if (segment.type === "paragraph" && isMarkdownTableRow(segment.text)) {
      const tableParagraphs: Array<{ raw: string; text: string }> = [];

      while (
        index < segments.length &&
        segments[index].type === "paragraph" &&
        isMarkdownTableRow((segments[index] as Segment & { text: string }).text)
      ) {
        const paragraph = segments[index] as Segment & {
          raw: string;
          text: string;
        };
        tableParagraphs.push({ raw: paragraph.raw, text: paragraph.text });
        index += 1;
      }

      if (
        tableParagraphs.length >= 2 &&
        isMarkdownTableSeparator(tableParagraphs[1].text)
      ) {
        result.push(buildHtmlTable(tableParagraphs.map((row) => row.text)));
        continue;
      }

      tableParagraphs.forEach((row) => result.push(row.raw));
      continue;
    }

    result.push(segment.raw);
    index += 1;
  }

  return result.join("");
}

export function wrapBareHtmlTables(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (match, offset, full) => {
    const before = full.slice(Math.max(0, offset - 60), offset);

    if (/<div class="markdown-table-wrapper">\s*$/.test(before)) {
      return match;
    }

    return `<div class="markdown-table-wrapper">${match}</div>`;
  });
}

const PRE_BLOCK_PATTERN = /<pre[\s>][\s\S]*?<\/pre>/gi;

function htmlFragmentToCodeText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/^\n+/, "")
      .replace(/\n+$/, ""),
  );
}

function skipOpeningFenceLine(segment: string): {
  language: string;
  contentStart: number;
} {
  const langMatch = segment.slice(3).match(/^(\w*)/);
  const language = langMatch?.[1] ?? "";
  const afterLanguageIndex = 3 + language.length;
  const rest = segment.slice(afterLanguageIndex);
  const lineBreakMatch = rest.match(
    /^[\s\r\n]*(?:(?:<\/p>\s*)?(?:<p[^>]*>)?\s*|<br\s*\/?>|\r\n|\n)?/i,
  );
  const contentStart =
    afterLanguageIndex + (lineBreakMatch?.[0]?.length ?? 0);

  return { language, contentStart };
}

function findFenceReplaceBounds(
  fragment: string,
  openIndex: number,
  closeIndex: number,
): { replaceStart: number; replaceEnd: number } {
  let replaceStart = openIndex;
  const openingPrefix = fragment.slice(0, openIndex);
  const openingParagraphMatch = openingPrefix.match(/<p[^>]*>\s*$/i);
  if (openingParagraphMatch) {
    replaceStart = openIndex - openingParagraphMatch[0].length;
  }

  let replaceEnd = closeIndex + 3;
  const closingSuffix = fragment.slice(closeIndex + 3);
  const closingParagraphMatch = closingSuffix.match(/^\s*<\/p>/i);
  if (closingParagraphMatch) {
    replaceEnd += closingParagraphMatch[0].length;
  }

  return { replaceStart, replaceEnd };
}

function convertFencesInFragment(fragment: string): string {
  if (!hasFencedCodeBlocks(fragment)) {
    return fragment;
  }

  let result = "";
  let cursor = 0;

  while (cursor < fragment.length) {
    const openIndex = fragment.indexOf("```", cursor);
    if (openIndex === -1) {
      result += fragment.slice(cursor);
      break;
    }

    const closeIndex = fragment.indexOf("```", openIndex + 3);
    if (closeIndex === -1) {
      result += fragment.slice(openIndex);
      break;
    }

    const { replaceStart, replaceEnd } = findFenceReplaceBounds(
      fragment,
      openIndex,
      closeIndex,
    );
    const segment = fragment.slice(openIndex, closeIndex + 3);
    const { language, contentStart } = skipOpeningFenceLine(segment);
    const closeInSegment = segment.lastIndexOf("```");
    const codeHtml = segment.slice(contentStart, closeInSegment);
    const codeText = htmlFragmentToCodeText(codeHtml);
    const languageClass = language
      ? ` class="language-${escapeHtml(language)}"`
      : "";

    result += fragment.slice(cursor, replaceStart);
    result += `<pre><code${languageClass}>${escapeHtml(codeText)}</code></pre>`;
    cursor = replaceEnd;
  }

  return result;
}

export function convertFencedCodeBlocksInHtml(html: string): string {
  if (!hasFencedCodeBlocks(html)) {
    return html;
  }

  let result = "";
  let lastIndex = 0;
  const preRegex = new RegExp(PRE_BLOCK_PATTERN.source, PRE_BLOCK_PATTERN.flags);
  let preMatch = preRegex.exec(html);

  while (preMatch) {
    result += convertFencesInFragment(html.slice(lastIndex, preMatch.index));
    result += preMatch[0];
    lastIndex = preMatch.index + preMatch[0].length;
    preMatch = preRegex.exec(html);
  }

  result += convertFencesInFragment(html.slice(lastIndex));
  return result;
}

export function prepareRichTextHtmlForDisplay(html: string): string {
  return wrapBareHtmlTables(
    convertFencedCodeBlocksInHtml(convertMarkdownTableParagraphsInHtml(html)),
  );
}

export function htmlToPlainText(html: string): string {
  return normalizeMarkdownTables(
    decodeHtmlEntities(
      html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
        .replace(/<\/li>\s*<li[^>]*>/gi, "\n")
        .replace(/<\/h[1-6]>\s*<h[1-6][^>]*>/gi, "\n\n")
        .replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    ),
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

  if (!isHtmlContent(trimmed)) {
    return {
      type: "markdown",
      content: normalizeMarkdownTables(trimmed),
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
