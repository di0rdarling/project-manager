"use client";

import PageContent from "@/components/layout/PageContent";
import EditableNameRow from "@/components/views/Account/EditableNameRow";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchCurrentUser } from "@/hooks/queries/useFetchCurrentUser";
import { formatDisplayDate } from "@/lib/dates";

type AccountDetailRowProps = {
  label: string;
  value: string;
};

function AccountDetailRow({ label, value }: AccountDetailRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export default function AccountView() {
  const {
    data: currentUser,
    isPending,
    isError,
    error,
  } = useFetchCurrentUser();

  return (
    <PageContent>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Account</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          View your account details and AI usage.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Account details</h2>

        {isPending ? (
          <LoadingMessage>Loading account details...</LoadingMessage>
        ) : null}

        {isError ? (
          <ErrorMessage
            error={error}
            fallbackMessage="Unable to load account details"
          />
        ) : null}

        {currentUser ? (
          <dl className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <EditableNameRow name={currentUser.name} />
            <AccountDetailRow label="Email" value={currentUser.email} />
            <AccountDetailRow
              label="Member since"
              value={formatDisplayDate(currentUser.createdAt)}
            />
          </dl>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">AI usage limits</h2>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Usage tracking is coming soon
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            This section will show your AI usage limits and how much of your
            monthly allowance you have used for chats, summaries, and other AI
            features.
          </p>
        </div>
      </section>
    </PageContent>
  );
}
