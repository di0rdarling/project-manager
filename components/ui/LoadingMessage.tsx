import type { HTMLAttributes } from "react";

const baseClassName = "text-sm text-zinc-600 dark:text-zinc-400";

type LoadingMessageProps = HTMLAttributes<HTMLParagraphElement>;

export function LoadingMessage({
  className,
  children,
  ...props
}: LoadingMessageProps) {
  return (
    <p
      className={className ? `${baseClassName} ${className}` : baseClassName}
      {...props}
    >
      {children}
    </p>
  );
}
