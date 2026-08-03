"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SubscriptionChip } from "@/components/ui/SubscriptionChip";
import UpgradeSubscriptionModal from "@/components/views/Account/UpgradeSubscriptionModal";
import CancelSubscriptionModal from "@/components/views/Account/CancelSubscriptionModal";
import type { UserSubscription } from "@/lib/types";

type SubscriptionRowProps = {
  subscription: UserSubscription;
};

export default function SubscriptionRow({ subscription }: SubscriptionRowProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const isPremium = subscription === "premium";

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Subscription
        </dt>

        <dd className="flex w-full flex-col gap-3 sm:max-w-md sm:items-end">
          <div className="flex w-full items-center justify-between gap-3 sm:justify-end">
            <SubscriptionChip subscription={subscription} />
          </div>

          {!isPremium ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Upgrade to Premium
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-sm text-red-600 underline-offset-2 transition hover:underline dark:text-red-400"
            >
              Cancel subscription
            </button>
          )}
        </dd>
      </div>

      <UpgradeSubscriptionModal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <CancelSubscriptionModal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </>
  );
}
