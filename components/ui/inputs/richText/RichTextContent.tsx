type RichTextContentProps = {
  content: string;
  className?: string;
};

export function RichTextContent({
  content,
  className,
}: Readonly<RichTextContentProps>) {
  const contentClassName = className
    ? `tiptap-content ${className}`
    : "tiptap-content text-sm text-zinc-800 dark:text-zinc-200";

  return (
    <div
      className={contentClassName}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
