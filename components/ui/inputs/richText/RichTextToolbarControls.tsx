type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
  children: React.ReactNode;
};

export function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  ariaLabel,
  title,
  children,
}: ToolbarButtonProps) {
  const activeClassName = isActive
    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      aria-pressed={isActive}
      className={`inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${activeClassName}`}
    >
      {children}
    </button>
  );
}

export function ToolbarDivider() {
  return (
    <div
      aria-hidden
      className="mx-1 hidden h-6 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
    />
  );
}

export function HeadingButton({
  level,
  isActive,
  onClick,
}: {
  level: 1 | 2 | 3;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Heading ${level}`}
      aria-pressed={isActive}
      className={`inline-flex min-w-8 cursor-pointer items-center justify-center rounded-md px-1.5 py-1 text-xs font-semibold transition ${
        isActive
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      H{level}
    </button>
  );
}
