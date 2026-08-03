"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { useUpdateCurrentUser } from "@/hooks/mutations/auth/useUpdateCurrentUser";

type CancelSubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
};

const PREMIUM_LOSSES = [
  "Lower AI usage limits for chats, summaries, and agent tasks",
  "No priority access to new AI features",
  "Tighter caps as your projects grow",
] as const;

export default function CancelSubscriptionModal({
  open,
  onClose,
}: CancelSubscriptionModalProps) {
  const cancelMutation = useUpdateCurrentUser({
    onSuccess: () => {
      onClose();
    },
  });

  function handleClose() {
    if (cancelMutation.isPending) {
      return;
    }

    cancelMutation.reset();
    onClose();
  }

  const errorMessage =
    cancelMutation.error instanceof Error ? cancelMutation.error.message : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cancel Premium subscription?"
      size="narrow"
      primaryAction={{
        label: "Keep Premium",
        onClick: handleClose,
        disabled: cancelMutation.isPending,
      }}
      secondaryAction={{
        label: "Yes, cancel subscription",
        pendingLabel: "Cancelling...",
        variant: "danger",
        onClick: () => cancelMutation.mutate({ subscription: "free" }),
        isPending: cancelMutation.isPending,
      }}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Are you sure about this?
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cancelling will move your account back to the Free plan. You
                can upgrade again later, but you&apos;ll lose your Premium
                benefits immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            What you&apos;ll lose
          </p>
          <ul className="space-y-2">
            {PREMIUM_LOSSES.map((loss) => (
              <li
                key={loss}
                className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500"
                />
                {loss}
              </li>
            ))}
          </ul>
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
