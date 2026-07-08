import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getRenderableRichTextContent } from "@/lib/rich-text";

type RichTextContentProps = {
  content: string;
  className?: string;
};

export function RichTextContent({
  content,
  className,
}: Readonly<RichTextContentProps>) {
  const renderable = getRenderableRichTextContent(content);
  const textClassName =
    className ?? "text-sm text-zinc-800 dark:text-zinc-200";

  if (renderable.type === "markdown") {
    return (
      <MarkdownContent content={renderable.content} className={textClassName} />
    );
  }

  const contentClassName = `tiptap-content ${textClassName}`;

  return (
    <div
      className={contentClassName}
      dangerouslySetInnerHTML={{ __html: renderable.content }}
    />
  );
}
