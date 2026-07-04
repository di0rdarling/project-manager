import type { HTMLAttributes } from "react";

const baseClassName = "text-sm text-red-600 dark:text-red-400";

type ErrorMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  error: unknown;
  fallbackMessage: string;
};

export function ErrorMessage({
  error,
  fallbackMessage,
  className,
  ...props
}: ErrorMessageProps) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return (
    <p
      className={className ? `${baseClassName} ${className}` : baseClassName}
      {...props}
    >
      {message}
    </p>
  );
}
