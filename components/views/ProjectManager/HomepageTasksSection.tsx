"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { AgentTaskGenerateAlternativeMenu } from "@/components/agents/AgentTaskGenerateAlternativeMenu";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import { useGenerateAgentTasks } from "@/hooks/mutations/chats/useGenerateAgentTasks";
import { useFetchDashboardTasks } from "@/hooks/queries/useFetchDashboardTasks";
import {
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
  isReplaceableAgentTaskStatus,
} from "@/lib/agents/agent-tasks";
import { appendAgentProfileTaskTitle } from "@/lib/chats/agent-profile-navigation";
import { isCrossProjectTeammate } from "@/lib/chats/chat-teammates";
import type { GenerateAgentTasksRequest } from "@/lib/api/agent-tasks";
import type { DashboardTaskItem } from "@/lib/types";

function DashboardTaskItemSkeleton() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
      aria-hidden
    >
      <div className="mt-0.5 size-8 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      <div className="min-w-0 flex-1 space-y-2 animate-pulse">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-48 max-w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

function isReplacingDashboardTask(
  task: DashboardTaskItem,
  isGenerating: boolean,
  variables: GenerateAgentTasksRequest | undefined,
): boolean {
  return (
    isGenerating &&
    variables?.replaceTaskTitle === task.title &&
    variables.projectId === task.projectId &&
    variables.teammateId === task.teammateId
  );
}

function DashboardTaskRow({
  task,
  isCompleted = false,
  onGenerateAlternative,
  isGeneratingAlternative = false,
  isGenerating = false,
}: {
  task: DashboardTaskItem;
  isCompleted?: boolean;
  onGenerateAlternative?: (task: DashboardTaskItem) => void;
  isGeneratingAlternative?: boolean;
  isGenerating?: boolean;
}) {
  const profileHref = appendAgentProfileTaskTitle(
    `/chats/agents/${task.teammateId}`,
    task.title,
    task.projectId,
  );
  const canGenerateAlternative =
    !isCompleted &&
    isReplaceableAgentTaskStatus(task.status) &&
    Boolean(onGenerateAlternative);

  if (isGeneratingAlternative) {
    return <DashboardTaskItemSkeleton />;
  }

  return (
    <div className="flex items-start gap-2">
      <Link
        href={profileHref}
        className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl border px-4 py-3 transition ${
          isCompleted
            ? "border-zinc-200 bg-zinc-50 opacity-90 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        }`}
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
            <p
              className={`text-sm font-medium ${
                isCompleted
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
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
          <p
            className={`mt-1 text-sm ${
              isCompleted
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {task.detail}
          </p>
        </div>
      </Link>
      {canGenerateAlternative ? (
        <AgentTaskGenerateAlternativeMenu
          taskTitle={task.title}
          onGenerateAlternative={() => onGenerateAlternative?.(task)}
          disabled={isGenerating}
        />
      ) : null}
    </div>
  );
}

export default function HomepageTasksSection() {
  const { data, isPending, isError, error } = useFetchDashboardTasks();
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const {
    mutate: generateTasks,
    isPending: isGenerating,
    variables: generateTasksVariables,
  } = useGenerateAgentTasks({
    onSuccess: (_response, input) => {
      if (input.replaceTaskTitle) {
        toast.success("Alternative task generated.");
      }
    },
    onError: (generateError) => {
      toast.error(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate alternative task.",
      );
    },
  });

  function handleGenerateAlternative(task: DashboardTaskItem) {
    generateTasks({
      teammateId: task.teammateId,
      projectId: task.projectId,
      replaceTaskTitle: task.title,
    });
  }

  const tasks = (data?.tasks ?? []).filter(
    (task) => !isCrossProjectTeammate(task.teammateId),
  );
  const completedTasks = (data?.completedTasks ?? []).filter(
    (task) => !isCrossProjectTeammate(task.teammateId),
  );
  const hasActiveTasks = tasks.length > 0;
  const hasCompletedTasks = completedTasks.length > 0;
  const hasAnyTasks = hasActiveTasks || hasCompletedTasks;

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
      ) : hasAnyTasks ? (
        <div className="space-y-3">
          {hasActiveTasks ? (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={`${task.projectId}-${task.title}`}>
                  <DashboardTaskRow
                    task={task}
                    onGenerateAlternative={handleGenerateAlternative}
                    isGenerating={isGenerating}
                    isGeneratingAlternative={isReplacingDashboardTask(
                      task,
                      isGenerating,
                      generateTasksVariables,
                    )}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No active tasks. View completed tasks below or visit an
                agent&apos;s profile to generate new ones.
              </p>
            </div>
          )}
          {hasCompletedTasks ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCompletedTasks((current) => !current)}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showCompletedTasks
                  ? "Hide completed tasks"
                  : `View completed tasks (${completedTasks.length})`}
              </button>
              {showCompletedTasks ? (
                <ul className="space-y-3">
                  {completedTasks.map((task) => (
                    <li key={`completed-${task.projectId}-${task.title}`}>
                      <DashboardTaskRow task={task} isCompleted />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
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
