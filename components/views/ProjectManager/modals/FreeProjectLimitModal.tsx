"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { useUpdateCurrentUser } from "@/hooks/mutations/auth/useUpdateCurrentUser";
import { getSubscriptionLimits } from "@/lib/account/subscription-limits";

type FreeProjectLimitModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
};

export default function FreeProjectLimitModal({
  open,
  onClose,
  onUpgradeSuccess,
}: FreeProjectLimitModalProps) {
  const projectLimit = getSubscriptionLimits("free").activeProjects ?? 1;

  const upgradeMutation = useUpdateCurrentUser({
    onSuccess: () => {
      onUpgradeSuccess?.();
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
      title="Project limit reached"
      size="narrow"
      primaryAction={{
        label: "Upgrade to premium",
        pendingLabel: "Upgrading...",
        onClick: () => upgradeMutation.mutate({ subscription: "premium" }),
        isPending: upgradeMutation.isPending,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
        disabled: upgradeMutation.isPending,
      }}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                You&apos;ve reached your free plan limit
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Free accounts can have up to {projectLimit} active project
                {projectLimit === 1 ? "" : "s"}. Upgrade to Premium to create
                unlimited projects and unlock higher AI usage limits.
              </p>
            </div>
          </div>
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
