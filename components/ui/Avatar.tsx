type AvatarSize = "sm" | "md";

type AvatarProps = {
  initials: string;
  src?: string;
  alt?: string;
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
  src,
  alt = "",
  colorClassName = "bg-zinc-700 dark:bg-zinc-600",
  size = "md",
  className,
}: AvatarProps) {
  const sizeClassName = sizeClassNames[size];
  const wrapperClassName = className
    ? `inline-flex shrink-0 overflow-hidden rounded-full ${sizeClassName} ${className}`
    : `inline-flex shrink-0 overflow-hidden rounded-full ${sizeClassName}`;

  if (src) {
    return (
      <span className={wrapperClassName}>
        <img src={src} alt={alt} className="size-full object-cover" />
      </span>
    );
  }

  const initialsClassName = className
    ? `inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white ${sizeClassName} ${colorClassName} ${className}`
    : `inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white ${sizeClassName} ${colorClassName}`;

  return (
    <span aria-hidden className={initialsClassName}>
      {initials}
    </span>
  );
}
