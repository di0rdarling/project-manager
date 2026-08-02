"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  deleteItemAction,
  ItemActionsMenu,
  regenerateItemAction,
} from "@/components/ui/ItemActionsMenu";
import { LoadingMessage } from "@/components/ui/LoadingMessage";
import AgentTaskDetailModal from "@/components/views/Chats/AgentTaskDetailModal";
import { AgentTaskGenerateAlternativeMenu } from "@/components/agents/AgentTaskGenerateAlternativeMenu";
import { useDeleteAgentTasks } from "@/hooks/mutations/chats/useDeleteAgentTasks";
import { useGenerateAgentTasks } from "@/hooks/mutations/chats/useGenerateAgentTasks";
import { useStartAgentTaskOutput } from "@/hooks/mutations/chats/useStartAgentTaskOutput";
import { useUpdateAgentTaskStatus } from "@/hooks/mutations/chats/useUpdateAgentTaskStatus";
import { useFetchAgentTasks } from "@/hooks/queries/useFetchAgentTasks";
import { agentDocumentKeys } from "@/lib/query-keys";
import {
  getAgentTaskStatus,
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
  getAgentTaskProjectName,
  canGenerateAgentTasks,
  canAcceptAgentTask,
  canReplaceAgentTask,
  getAgentTaskDecisionStatus,
  getActiveAgentTasks,
  getCompletedAgentTasks,
  getSlotOccupyingAcceptedAgentTasks,
} from "@/lib/agents/agent-tasks";
import { parseAgentProfileNavigationContext, AGENT_PROFILE_TASK_TITLE_PARAM, AGENT_TASKS_SECTION_ID } from "@/lib/chats/agent-profile-navigation";
import type { StartAgentTaskOutputInput } from "@/lib/api/agent-tasks";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTask } from "@/lib/types";

type AgentTasksProps = {
  teammateId: ChatTeammateId;
  projectId: string | null | undefined;
};

function AgentTaskListItemSkeleton() {
  return (
    <li className="px-4 py-3" aria-hidden>
      <div className="flex items-start gap-3 animate-pulse">
        <div className="mt-0.5 size-4 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="min-w-0 flex-1 space-y-2">
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
    </li>
  );
}

export default function AgentTasks({
  teammateId,
  projectId,
}: Readonly<AgentTasksProps>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const navigationContext = parseAgentProfileNavigationContext(searchParams);
  const openTaskTitle = searchParams.get(AGENT_PROFILE_TASK_TITLE_PARAM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const isRegeneratingRef = useRef(false);
  const isRegeneratingOutputRef = useRef(false);
  const replacingTaskIndexRef = useRef<number | null>(null);
  const openTaskForAlternativeRef = useRef<string | null>(null);

  const {
    data: agentTasks,
    isFetching,
    isError,
    error,
  } = useFetchAgentTasks(teammateId, projectId);

  const {
    mutate: generateTasks,
    isPending: isGenerating,
    isError: isGenerateError,
    error: generateError,
    reset: resetGenerate,
    variables: generateTasksVariables,
  } = useGenerateAgentTasks({
    onSuccess: (response, input) => {
      if (input.replaceTaskTitle) {
        const replacedTaskIndex = replacingTaskIndexRef.current;

        if (
          replacedTaskIndex !== null &&
          replacedTaskIndex >= 0 &&
          openTaskForAlternativeRef.current === input.replaceTaskTitle
        ) {
          setSelectedTask(response.tasks[replacedTaskIndex] ?? null);
        }

        replacingTaskIndexRef.current = null;
        openTaskForAlternativeRef.current = null;
        toast.success("Alternative task generated.");
        return;
      }

      const activeAcceptedCount =
        getSlotOccupyingAcceptedAgentTasks(response.tasks).length;

      if (isRegeneratingRef.current) {
        toast.success(
          activeAcceptedCount > 0
            ? "New tasks generated. Active accepted tasks were kept."
            : "Tasks regenerated successfully.",
        );
        return;
      }

      toast.success("Tasks generated successfully.");
    },
  });

  const deleteTasksMutation = useDeleteAgentTasks({
    onSuccess: () => {
      toast.success("Tasks cleared successfully.");
      setIsDeleteModalOpen(false);
    },
  });

  const updateTaskStatusMutation = useUpdateAgentTaskStatus({
    onSuccess: (response, input) => {
      if (input.status === "rejected") {
        setSelectedTask(null);
        void queryClient.invalidateQueries({
          queryKey: agentDocumentKeys.list(teammateId),
        });
        toast.success("Task rejected.");
        return;
      }

      const updatedTask = response.tasks.find(
        (task) => task.title === input.taskTitle,
      );

      if (updatedTask) {
        setSelectedTask(updatedTask);
      }

      toast.success("Task accepted.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task.",
      );
    },
  });

  const startTaskOutputMutation = useStartAgentTaskOutput({
    onSuccess: (response, input) => {
      const updatedTask = response.tasks.find(
        (task) => task.title === input.taskTitle,
      );

      if (updatedTask) {
        setSelectedTask(updatedTask);
      }

      if (isRegeneratingOutputRef.current) {
        toast.success(
          updatedTask?.outputDocumentTitle
            ? `New document created: "${updatedTask.outputDocumentTitle}"`
            : "Teammate redid the task.",
        );
        return;
      }

      toast.success(
        updatedTask?.outputDocumentTitle
          ? `Document created: "${updatedTask.outputDocumentTitle}"`
          : "Teammate finished the task.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : isRegeneratingOutputRef.current
            ? "Failed to redo task."
            : "Failed to start task.",
      );
    },
  });

  function handleTaskStatusChange(
    status: "accepted" | "rejected",
  ) {
    if (!projectId || !selectedTask) {
      return;
    }

    updateTaskStatusMutation.mutate({
      teammateId,
      projectId,
      taskTitle: selectedTask.title,
      status,
    });
  }

  function handleStartTaskOutput(input: StartAgentTaskOutputInput) {
    if (!projectId || !selectedTask) {
      return;
    }

    isRegeneratingOutputRef.current = input.regenerate;
    startTaskOutputMutation.mutate({
      teammateId,
      projectId,
      taskTitle: selectedTask.title,
      regenerate: input.regenerate,
      modelId: input.modelId,
    });
  }

  function handleGenerate(isRegenerate: boolean) {
    if (!projectId) {
      return;
    }

    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateTasks({ teammateId, projectId });
  }

  function handleGenerateAlternative(taskTitle: string) {
    if (!projectId) {
      return;
    }

    replacingTaskIndexRef.current = tasks.findIndex(
      (task) => task.title === taskTitle,
    );
    openTaskForAlternativeRef.current =
      selectedTask?.title === taskTitle ? taskTitle : null;
    isRegeneratingRef.current = false;
    resetGenerate();
    generateTasks({ teammateId, projectId, replaceTaskTitle: taskTitle });
  }

  function handleDeleteModalClose() {
    if (deleteTasksMutation.isPending) {
      return;
    }

    deleteTasksMutation.reset();
    setIsDeleteModalOpen(false);
  }

  const tasks = agentTasks?.tasks ?? [];
  const projectName = agentTasks?.projectName ?? null;
  const activeTasks = getActiveAgentTasks(tasks);
  const completedTasks = getCompletedAgentTasks(tasks);
  const hasActiveTasks = activeTasks.length > 0;
  const hasCompletedTasks = completedTasks.length > 0;
  const hasAnyTasks = tasks.length > 0;
  const activeAcceptedTaskCount =
    getSlotOccupyingAcceptedAgentTasks(tasks).length;
  const canGenerateMoreTasks = canGenerateAgentTasks(tasks);
  const isInitialLoading = Boolean(projectId) && isFetching && !agentTasks;
  const replacingTaskTitle = generateTasksVariables?.replaceTaskTitle;
  const isReplacingTask = isGenerating && Boolean(replacingTaskTitle);
  const isBulkGenerating = isGenerating && !replacingTaskTitle;

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    const updatedTask = tasks.find((item) => item.title === selectedTask.title);

    if (
      updatedTask &&
      (updatedTask.outputDocumentStatus !== selectedTask.outputDocumentStatus ||
        getAgentTaskDecisionStatus(updatedTask) !==
          getAgentTaskDecisionStatus(selectedTask))
    ) {
      setSelectedTask(updatedTask);
    }
  }, [tasks, selectedTask]);

  useEffect(() => {
    if (!openTaskTitle || !projectId || isFetching) {
      return;
    }

    const task = tasks.find((item) => item.title === openTaskTitle);

    if (task) {
      setSelectedTask(task);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete(AGENT_PROFILE_TASK_TITLE_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [
    openTaskTitle,
    projectId,
    isFetching,
    tasks,
    searchParams,
    pathname,
    router,
  ]);

  if (!projectId) {
    return (
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <ClipboardDocumentCheckIcon className="size-4" aria-hidden />
          Tasks
        </h2>
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Open this profile from a project to generate tasks grounded in that
            project&apos;s context and goal.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id={AGENT_TASKS_SECTION_ID} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <ClipboardDocumentCheckIcon className="size-4" aria-hidden />
            Tasks
          </h2>
          {hasAnyTasks ? (
            <ItemActionsMenu
              actions={[
                regenerateItemAction(
                  activeAcceptedTaskCount > 0
                    ? "Generate more tasks"
                    : "Regenerate tasks",
                  () => handleGenerate(true),
                  isGenerating || !canGenerateMoreTasks,
                ),
                deleteItemAction(
                  "Clear tasks",
                  () => setIsDeleteModalOpen(true),
                  isGenerating,
                ),
              ]}
            />
          ) : null}
        </div>

        {isInitialLoading ? (
          <LoadingMessage>Loading tasks...</LoadingMessage>
        ) : isBulkGenerating ? (
          <LoadingMessage>
            {isRegeneratingRef.current
              ? activeAcceptedTaskCount > 0
                ? "Generating more tasks..."
                : "Regenerating tasks..."
              : "Generating tasks..."}
          </LoadingMessage>
        ) : isError ? (
          <ErrorMessage error={error} fallbackMessage="Failed to load tasks" />
        ) : hasActiveTasks || hasCompletedTasks ? (
          <>
            {isGenerateError ? (
              <ErrorMessage
                error={generateError}
                fallbackMessage="Failed to generate tasks"
              />
            ) : null}
            {!canGenerateMoreTasks ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All three active task slots are filled with accepted tasks. Clear
                tasks to start a new set.
              </p>
            ) : null}
            {hasActiveTasks ? (
              <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
                {activeTasks.map((task) => {
                  const taskStatus = getAgentTaskStatus(task);
                  const isRejected = taskStatus === "rejected";
                  const taskProjectName = getAgentTaskProjectName(task, projectName);
                  const isGeneratingAlternative =
                    isReplacingTask && replacingTaskTitle === task.title;
                  const canGenerateAlternative =
                    canReplaceAgentTask(tasks, task.title) && !isGenerating;

                  if (isGeneratingAlternative) {
                    return <AgentTaskListItemSkeleton key={task.title} />;
                  }

                  return (
                    <li key={task.title}>
                      <div className="flex items-start gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className={`flex min-w-0 flex-1 items-start gap-3 text-left transition ${
                            isRejected
                              ? "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                          } -mx-2 rounded-xl px-2 py-1`}
                        >
                          <ClipboardDocumentCheckIcon
                            className={`mt-0.5 size-4 shrink-0 ${
                              isRejected
                                ? "text-zinc-300 dark:text-zinc-600"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-sm font-medium ${
                                  isRejected
                                    ? "text-zinc-400 dark:text-zinc-500"
                                    : "text-zinc-800 dark:text-zinc-100"
                                }`}
                              >
                                {task.title}
                              </p>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskStatusBadgeClassName(taskStatus)}`}
                              >
                                {getAgentTaskStatusLabel(taskStatus)}
                              </span>
                              {taskProjectName ? (
                                <span
                                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskProjectBadgeClassName()}`}
                                >
                                  {taskProjectName}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`mt-1 text-sm leading-relaxed ${
                                isRejected
                                  ? "text-zinc-400 dark:text-zinc-500"
                                  : "text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              {task.detail}
                            </p>
                          </div>
                          <ChevronRightIcon
                            className={`mt-0.5 size-4 shrink-0 ${
                              isRejected
                                ? "text-zinc-300 dark:text-zinc-600"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                            aria-hidden
                          />
                        </button>
                        {canGenerateAlternative ? (
                          <AgentTaskGenerateAlternativeMenu
                            taskTitle={task.title}
                            onGenerateAlternative={handleGenerateAlternative}
                            disabled={isGenerating}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No active tasks. Generate a new set or view completed tasks
                  below.
                </p>
                <Button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                  className="mt-4"
                >
                  Generate tasks
                </Button>
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
                  <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-zinc-50 opacity-90 dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60">
                    {completedTasks.map((task) => {
                      const taskStatus = getAgentTaskStatus(task);
                      const taskProjectName = getAgentTaskProjectName(
                        task,
                        projectName,
                      );

                      return (
                        <li key={task.title}>
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40"
                          >
                            <ClipboardDocumentCheckIcon
                              className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                  {task.title}
                                </p>
                                <span
                                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskStatusBadgeClassName(taskStatus)}`}
                                >
                                  {getAgentTaskStatusLabel(taskStatus)}
                                </span>
                                {taskProjectName ? (
                                  <span
                                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskProjectBadgeClassName()}`}
                                  >
                                    {taskProjectName}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                                {task.detail}
                              </p>
                            </div>
                            <ChevronRightIcon
                              className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                              aria-hidden
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Generate tasks this teammate could take on autonomously, grounded
              in the project context and goal.
            </p>
            {isGenerateError ? (
              <div className="mt-4 text-left">
                <ErrorMessage
                  error={generateError}
                  fallbackMessage="Failed to generate tasks"
                />
              </div>
            ) : null}
            <Button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="mt-4"
            >
              Generate tasks
            </Button>
          </div>
        )}
      </section>

      <DeleteAISummaryModal
        open={isDeleteModalOpen}
        title="Clear tasks"
        description="Are you sure you want to clear these tasks? You can generate a new set anytime."
        confirmLabel="Clear tasks"
        pendingLabel="Clearing..."
        isPending={deleteTasksMutation.isPending}
        error={deleteTasksMutation.error}
        onClose={handleDeleteModalClose}
        onConfirm={() => {
          if (!projectId) {
            return;
          }

          deleteTasksMutation.mutate({ teammateId, projectId });
        }}
      />

      <AgentTaskDetailModal
        open={selectedTask !== null}
        task={selectedTask}
        onClose={() => {
          if (
            updateTaskStatusMutation.isPending ||
            startTaskOutputMutation.isPending
          ) {
            return;
          }

          setSelectedTask(null);
        }}
        onAccept={() => handleTaskStatusChange("accepted")}
        onReject={() => handleTaskStatusChange("rejected")}
        isUpdating={updateTaskStatusMutation.isPending}
        canAccept={
          selectedTask ? canAcceptAgentTask(tasks, selectedTask.title) : false
        }
        projectName={projectName}
        teammateId={teammateId}
        profileFrom={navigationContext.from}
        profileProjectId={navigationContext.projectId}
        onStartOutput={handleStartTaskOutput}
        isStartingOutput={startTaskOutputMutation.isPending}
        isRegeneratingOutput={
          startTaskOutputMutation.variables?.regenerate === true
        }
        onGenerateAlternative={
          selectedTask && canReplaceAgentTask(tasks, selectedTask.title)
            ? () => handleGenerateAlternative(selectedTask.title)
            : undefined
        }
        isGeneratingAlternative={
          isReplacingTask && replacingTaskTitle === selectedTask?.title
        }
      />
    </>
  );
}
