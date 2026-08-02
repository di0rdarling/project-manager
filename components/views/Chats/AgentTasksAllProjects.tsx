"use client";

import Link from "next/link";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useFetchAgentTasksAllProjects } from "@/hooks/queries/useFetchAgentTasksAllProjects";
import {
  getAgentTaskStatus,
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
} from "@/lib/agents/agent-tasks";
import {
  appendAgentProfileTaskTitle,
} from "@/lib/chats/agent-profile-navigation";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";

type AgentTasksAllProjectsProps = {
  teammateId: ChatTeammateId;
};

export default function AgentTasksAllProjects({
  teammateId,
}: Readonly<AgentTasksAllProjectsProps>) {
  const {
    data,
    isPending,
    isError,
    error,
  } = useFetchAgentTasksAllProjects(teammateId);

  const allTasks =
    data?.projects.flatMap((project) =>
      project.tasks.map((task) => ({
        task,
        projectId: project.projectId,
        projectName: project.projectName,
      })),
    ) ?? [];

  // Sort by status priority: pending, in_review, accepted, completed
  const statusOrder: Record<string, number> = {
    pending: 0,
    in_review: 1,
    accepted: 2,
    completed: 3,
  };

  const sortedTasks = [...allTasks].sort((a, b) => {
    const statusA = getAgentTaskStatus(a.task);
    const statusB = getAgentTaskStatus(b.task);
    const orderDiff = statusOrder[statusA] - statusOrder[statusB];
    if (orderDiff !== 0) return orderDiff;
    return 0;
  });

  const hasTasks = sortedTasks.length > 0;

  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <ClipboardDocumentCheckIcon className="size-4" aria-hidden />
        Tasks across projects
      </h2>

      {isPending ? (
        <LoadingMessage>Loading tasks...</LoadingMessage>
      ) : isError ? (
        <ErrorMessage error={error} fallbackMessage="Failed to load tasks" />
      ) : hasTasks ? (
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          {sortedTasks.map(({ task, projectId, projectName }) => {
            const taskStatus = getAgentTaskStatus(task);
            const profileHref = appendAgentProfileTaskTitle(
              `/chats/agents/${teammateId}`,
              task.title,
              projectId,
            );

            return (
              <li key={`${projectId}-${task.title}`}>
                <Link
                  href={profileHref}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <ClipboardDocumentCheckIcon
                    className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {task.title}
                      </p>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskStatusBadgeClassName(taskStatus)}`}
                      >
                        {getAgentTaskStatusLabel(taskStatus)}
                      </span>
                      {projectName ? (
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskProjectBadgeClassName()}`}
                        >
                          {projectName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {task.detail}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No tasks yet. Open this teammate&apos;s profile from a project to
            generate tasks grounded in that project&apos;s context.
          </p>
        </div>
      )}
    </section>
  );
}
