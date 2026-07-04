import type { ButtonHTMLAttributes } from "react";

const baseClassName =
  "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const variantClassNames = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900",
} as const;

type ButtonVariant = keyof typeof variantClassNames;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const buttonClassName = `${baseClassName} ${variantClassNames[variant]}`;

  return (
    <button
      className={className ? `${buttonClassName} ${className}` : buttonClassName}
      {...props}
    />
  );
}
