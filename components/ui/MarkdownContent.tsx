import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  variant?: "default" | "inverted";
  className?: string;
};

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="markdown-table-wrapper">
      <table>{children}</table>
    </div>
  ),
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
