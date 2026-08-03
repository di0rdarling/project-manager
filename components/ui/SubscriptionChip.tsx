import { CrownIcon } from "@/components/ui/icons/CrownIcon";
import type { UserSubscription } from "@/lib/types";

type SubscriptionChipProps = {
  subscription: UserSubscription;
  size?: "sm" | "md";
  iconOnly?: boolean;
  className?: string;
};

const sizeClassNames = {
  sm: {
    chip: "gap-1 px-2 py-0.5 text-xs",
    icon: "size-3",
  },
  md: {
    chip: "gap-1.5 px-2.5 py-1 text-sm",
    icon: "size-4",
  },
} as const;

function getChipClassName(subscription: UserSubscription): string {
  if (subscription === "premium") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
}

function getLabel(subscription: UserSubscription): string {
  return subscription === "premium" ? "Premium" : "Free";
}

export function SubscriptionChip({
  subscription,
  size = "md",
  iconOnly = false,
  className,
}: SubscriptionChipProps) {
  const isPremium = subscription === "premium";
  const sizeClasses = sizeClassNames[size];
  const label = getLabel(subscription);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-medium ${sizeClasses.chip} ${getChipClassName(subscription)} ${className ?? ""}`}
      title={label}
    >
      {isPremium ? (
        <CrownIcon className={sizeClasses.icon} aria-hidden="true" />
      ) : null}
      {iconOnly && isPremium ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}
