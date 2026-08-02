"use client";

import Link from "next/link";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchDashboardTasks } from "@/hooks/queries/useFetchDashboardTasks";
import {
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
} from "@/lib/agents/agent-tasks";
import { appendAgentProfileTaskTitle } from "@/lib/chats/agent-profile-navigation";

export default function HomepageTasksSection() {
  const { data, isPending, isError, error } = useFetchDashboardTasks();

  const tasks = data?.tasks ?? [];
  const hasTasks = tasks.length > 0;

  return (
    <section className="space-y-4">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
        <ClipboardDocumentCheckIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
        Tasks
      </h2>

      {isPending ? (
        <LoadingMessage>Loading tasks...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load tasks" />
      ) : hasTasks ? (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const profileHref = appendAgentProfileTaskTitle(
              `/chats/agents/${task.teammateId}`,
              task.title,
              task.projectId,
            );

            return (
              <li key={`${task.projectId}-${task.title}`}>
                <Link
                  href={profileHref}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <Avatar
                    initials={task.teammateAvatarInitials}
                    src={task.teammateAvatarImageSrc}
                    alt={task.teammateName}
                    colorClassName={task.teammateAvatarColorClassName}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {task.title}
                      </p>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskStatusBadgeClassName(task.status)}`}
                      >
                        {getAgentTaskStatusLabel(task.status)}
                      </span>
                      {task.projectName ? (
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskProjectBadgeClassName()}`}
                        >
                          {task.projectName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {task.detail}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No active tasks. Visit an agent&apos;s profile from a project to
            generate tasks.
          </p>
        </div>
      )}
    </section>
  );
}
