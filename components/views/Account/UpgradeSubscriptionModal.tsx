"use client";

import { SparklesIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { useUpdateCurrentUser } from "@/hooks/mutations/auth/useUpdateCurrentUser";

type UpgradeSubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
};

const PREMIUM_BENEFITS = [
  "Higher AI usage limits across chats, summaries, and agent tasks",
  "Priority access to new AI features as they launch",
  "More room to grow your projects without hitting caps",
] as const;

export default function UpgradeSubscriptionModal({
  open,
  onClose,
}: UpgradeSubscriptionModalProps) {
  const upgradeMutation = useUpdateCurrentUser({
    onSuccess: () => {
      onClose();
    },
  });

  function handleClose() {
    if (upgradeMutation.isPending) {
      return;
    }

    upgradeMutation.reset();
    onClose();
  }

  const errorMessage =
    upgradeMutation.error instanceof Error
      ? upgradeMutation.error.message
      : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upgrade to Premium"
      size="narrow"
      primaryAction={{
        label: "Upgrade to Premium",
        pendingLabel: "Upgrading...",
        onClick: () => upgradeMutation.mutate({ subscription: "premium" }),
        isPending: upgradeMutation.isPending,
      }}
      secondaryAction={{
        label: "Not now",
        onClick: handleClose,
        disabled: upgradeMutation.isPending,
      }}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <SparklesIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                You&apos;re one step away from Premium
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Upgrade your account to unlock more AI capacity and get the most
                out of your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            What you&apos;ll get
          </p>
          <ul className="space-y-2">
            {PREMIUM_BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500"
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ready to upgrade? Confirm below and your account will switch to
          Premium right away.
        </p>

        {errorMessage ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
