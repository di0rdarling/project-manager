import type { ButtonHTMLAttributes } from "react";

type FilterPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

export function FilterPill({
  isActive = false,
  className,
  type = "button",
  ...props
}: FilterPillProps) {
  const baseClassName =
    "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const activeClassName =
    "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";
  const inactiveClassName =
    "border-zinc-300 bg-transparent text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900";

  const pillClassName = `${baseClassName} ${isActive ? activeClassName : inactiveClassName}`;

  return (
    <button
      type={type}
      className={className ? `${pillClassName} ${className}` : pillClassName}
      {...props}
    />
  );
}
