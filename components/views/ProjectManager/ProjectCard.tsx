"use client";

import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  deleteItemAction,
  editItemAction,
  ItemActionsMenu,
} from "@/components/ui/ItemActionsMenu";
import { ListItemDate } from "@/components/ui/ListItemDate";
import { formatRelativeDate, isSameCalendarDay } from "@/lib/dates";
import type { ProjectResponse } from "@/lib/types";

type ActivityStatus =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "inactive";

function getActivityStatus(updatedAt: string): ActivityStatus {
  const updated = new Date(updatedAt);
  const now = new Date();

  if (isSameCalendarDay(updated, now)) {
    return "today";
  }

  const diffMs = now.getTime() - updated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    return "thisWeek";
  }

  if (diffDays < 30) {
    return "thisMonth";
  }

  return "inactive";
}

const activityConfig: Record<
  ActivityStatus,
  { label: string; className: string }
> = {
  today: {
    label: "Active today",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  thisWeek: {
    label: "Active this week",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  thisMonth: {
    label: "Active this month",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  },
  inactive: {
    label: "No recent activity",
    className:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
  },
};

interface ProjectCardProps {
  project: ProjectResponse;
  onEdit: (project: ProjectResponse) => void;
  onDelete: (project: ProjectResponse) => void;
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
}: Readonly<ProjectCardProps>) {
  const activity = getActivityStatus(project.updatedAt);
  const activityStyles = activityConfig[activity];

  return (
    <article className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <Link
        href={`/projects/${project._id}`}
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 rounded-2xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Updated{" "}
            <time dateTime={project.updatedAt}>
              {formatRelativeDate(project.updatedAt)}
            </time>
          </p>
        </div>
        <div className="relative z-10">
          <ItemActionsMenu
            actions={[
              editItemAction(`Edit ${project.name}`, () => onEdit(project)),
              deleteItemAction(`Delete ${project.name}`, () => onDelete(project)),
            ]}
          />
        </div>
      </div>

      {project.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {project.description}
        </p>
      ) : (
        <p className="mt-3 text-sm italic text-zinc-400 dark:text-zinc-600">
          No description
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${activityStyles.className}`}
        >
          <ClockIcon className="size-3.5" aria-hidden />
          {activityStyles.label}
        </span>

        <Link
          href={`/projects/${project._id}/chats`}
          className="relative z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <ChatBubbleLeftRightIcon className="size-3.5" aria-hidden />
          Chats
        </Link>

        <Link
          href={`/projects/${project._id}/notes`}
          className="relative z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <DocumentTextIcon className="size-3.5" aria-hidden />
          Notes
        </Link>
      </div>

      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
        <ListItemDate
          dateTime={project.createdAt}
          className="text-xs text-zinc-400 dark:text-zinc-600"
        />
      </div>
    </article>
  );
}
