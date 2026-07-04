import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  variant?: "default" | "inverted";
  className?: string;
};

export function MarkdownContent({
  content,
  variant = "default",
  className,
}: Readonly<MarkdownContentProps>) {
  const contentClassName = [
    "markdown-content",
    variant === "inverted" ? "markdown-content-inverted" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={contentClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
