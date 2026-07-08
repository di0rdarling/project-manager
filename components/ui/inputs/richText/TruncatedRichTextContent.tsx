"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { RichTextContent } from "./RichTextContent";

const DEFAULT_MAX_HEIGHT = 200;

type TruncatedRichTextContentProps = {
  content: string;
  className?: string;
  maxHeight?: number;
};

export function TruncatedRichTextContent({
  content,
  className,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: Readonly<TruncatedRichTextContentProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function checkOverflow() {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      setIsTruncated(element.scrollHeight > element.clientHeight);
    }

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(container);

    return () => observer.disconnect();
  }, [content, maxHeight]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ maxHeight }}
      >
        <RichTextContent content={content} className={className} />
      </div>
      {isTruncated ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent dark:from-zinc-950"
        />
      ) : null}
    </div>
  );
}
