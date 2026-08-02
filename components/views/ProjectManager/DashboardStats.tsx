"use client";

import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchDashboard } from "@/hooks/queries/useFetchDashboard";

const statItems = [
  {
    key: "totalProjects",
    label: "Total projects",
    icon: FolderIcon,
  },
  {
    key: "openChats",
    label: "Open chats",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    key: "notesThisWeek",
    label: "Notes this week",
    icon: DocumentTextIcon,
  },
] as const;

export default function DashboardStats() {
  const { data, isPending, isError, error } = useFetchDashboard();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <LoadingMessage>Loading {item.label.toLowerCase()}...</LoadingMessage>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <ErrorMessage
          error={error}
          fallbackMessage="Failed to load dashboard stats"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = data[item.key];

        return (
          <div
            key={item.key}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Icon className="size-6 text-zinc-600 dark:text-zinc-400" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {value}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
