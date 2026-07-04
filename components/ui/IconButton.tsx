import type { ButtonHTMLAttributes } from "react";

const baseClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-60";

const variantClassNames = {
  ghost:
    "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
  secondary:
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900",
  danger:
    "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
} as const;

type IconButtonVariant = keyof typeof variantClassNames;

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconButtonVariant;
  "aria-label": string;
};

export function IconButton({
  variant = "ghost",
  className,
  ...props
}: IconButtonProps) {
  const buttonClassName = `${baseClassName} ${variantClassNames[variant]}`;

  return (
    <button
      className={className ? `${buttonClassName} ${className}` : buttonClassName}
      {...props}
    />
  );
}
