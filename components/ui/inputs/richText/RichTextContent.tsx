import { MarkdownContent } from "@/components/ui/MarkdownContent";
import {
  annotateRichTextHeadings,
  getRenderableRichTextContent,
  normalizeMarkdownTables,
  prepareRichTextHtmlForDisplay,
} from "@/lib/rich-text";
import type { RichTextHeading } from "@/lib/rich-text";

type RichTextContentProps = {
  content: string;
  className?: string;
  headings?: RichTextHeading[];
};

export function RichTextContent({
  content,
  className,
  headings,
}: Readonly<RichTextContentProps>) {
  const renderable = getRenderableRichTextContent(content);
  const textClassName =
    className ?? "text-sm text-zinc-800 dark:text-zinc-200";

  if (renderable.type === "markdown") {
    return (
      <MarkdownContent
        content={normalizeMarkdownTables(renderable.content)}
        className={textClassName}
        headings={headings}
      />
    );
  }

  const htmlContent = prepareRichTextHtmlForDisplay(
    headings?.length
      ? annotateRichTextHeadings(content, headings)
      : renderable.content,
  );
  const contentClassName = `tiptap-content ${textClassName}`;

  return (
    <div
      className={contentClassName}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
