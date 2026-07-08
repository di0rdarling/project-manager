import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RichTextHeading } from "@/lib/rich-text";

type MarkdownContentProps = {
  content: string;
  variant?: "default" | "inverted";
  className?: string;
  headings?: RichTextHeading[];
};

const baseMarkdownComponents: Components = {
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

function createMarkdownComponents(headings?: RichTextHeading[]): Components {
  if (!headings?.length) {
    return baseMarkdownComponents;
  }

  let headingIndex = 0;

  function createHeadingComponent(
    Tag: "h1" | "h2" | "h3",
    level: RichTextHeading["level"],
  ) {
    return function MarkdownHeading({
      children,
    }: Readonly<{ children?: React.ReactNode }>) {
      const heading = headings[headingIndex];
      headingIndex += 1;
      const id = heading?.level === level ? heading.id : undefined;

      return (
        <Tag id={id} className={id ? "scroll-mt-24" : undefined}>
          {children}
        </Tag>
      );
    };
  }

  return {
    ...baseMarkdownComponents,
    h1: createHeadingComponent("h1", 1),
    h2: createHeadingComponent("h2", 2),
    h3: createHeadingComponent("h3", 3),
  };
}

export function MarkdownContent({
  content,
  variant = "default",
  className,
  headings,
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
        components={createMarkdownComponents(headings)}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
