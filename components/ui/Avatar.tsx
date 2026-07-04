type AvatarSize = "sm" | "md";

type AvatarProps = {
  initials: string;
  colorClassName?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClassNames: Record<AvatarSize, string> = {
  sm: "size-6 text-[10px]",
  md: "size-9 text-sm",
};

export function Avatar({
  initials,
  colorClassName = "bg-zinc-700 dark:bg-zinc-600",
  size = "md",
  className,
}: AvatarProps) {
  const baseClassName = `inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white ${sizeClassNames[size]} ${colorClassName}`;

  return (
    <span
      aria-hidden
      className={className ? `${baseClassName} ${className}` : baseClassName}
    >
      {initials}
    </span>
  );
}
