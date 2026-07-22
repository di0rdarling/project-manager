"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
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
import { useDeleteAgentTasks } from "@/hooks/mutations/chats/useDeleteAgentTasks";
import { useGenerateAgentTasks } from "@/hooks/mutations/chats/useGenerateAgentTasks";
import { useUpdateAgentTaskStatus } from "@/hooks/mutations/chats/useUpdateAgentTaskStatus";
import { useFetchAgentTasks } from "@/hooks/queries/useFetchAgentTasks";
import { getAgentTaskStatus, getAgentTaskStatusBadgeClassName, getAgentTaskStatusLabel, getAgentTaskProjectBadgeClassName, getAgentTaskProjectName, canGenerateAgentTasks, canAcceptAgentTask, getAcceptedAgentTasks } from "@/lib/agents/agent-tasks";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTask } from "@/lib/types";

type AgentTasksProps = {
  teammateId: ChatTeammateId;
  projectId: string | null | undefined;
};

export default function AgentTasks({
  teammateId,
  projectId,
}: Readonly<AgentTasksProps>) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const isRegeneratingRef = useRef(false);

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
  } = useGenerateAgentTasks({
    onSuccess: (response) => {
      const acceptedCount = getAcceptedAgentTasks(response.tasks).length;

      if (isRegeneratingRef.current) {
        toast.success(
          acceptedCount > 0
            ? "New tasks generated. Accepted tasks were kept."
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
      const updatedTask = response.tasks.find(
        (task) => task.title === input.taskTitle,
      );

      if (updatedTask) {
        setSelectedTask(updatedTask);
      }

      toast.success(
        input.status === "accepted"
          ? "Task accepted."
          : "Task rejected.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task.",
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

  function handleGenerate(isRegenerate: boolean) {
    if (!projectId) {
      return;
    }

    isRegeneratingRef.current = isRegenerate;
    resetGenerate();
    generateTasks({ teammateId, projectId });
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
  const hasTasks = tasks.length > 0;
  const acceptedTaskCount = getAcceptedAgentTasks(tasks).length;
  const canGenerateMoreTasks = canGenerateAgentTasks(tasks);
  const isInitialLoading = Boolean(projectId) && isFetching && !agentTasks;

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
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <ClipboardDocumentCheckIcon className="size-4" aria-hidden />
            Tasks
          </h2>
          {hasTasks ? (
            <ItemActionsMenu
              actions={[
                regenerateItemAction(
                  acceptedTaskCount > 0 ? "Generate more tasks" : "Regenerate tasks",
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
        ) : isGenerating ? (
          <LoadingMessage>
            {isRegeneratingRef.current
              ? acceptedTaskCount > 0
                ? "Generating more tasks..."
                : "Regenerating tasks..."
              : "Generating tasks..."}
          </LoadingMessage>
        ) : isError ? (
          <ErrorMessage error={error} fallbackMessage="Failed to load tasks" />
        ) : hasTasks ? (
          <>
            {isGenerateError ? (
              <ErrorMessage
                error={generateError}
                fallbackMessage="Failed to generate tasks"
              />
            ) : null}
            {!canGenerateMoreTasks ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All three task slots are filled with accepted tasks. Clear tasks
                to start a new set.
              </p>
            ) : null}
            <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
              {tasks.map((task) => {
                const taskStatus = getAgentTaskStatus(task);
                const isRejected = taskStatus === "rejected";
                const taskProjectName = getAgentTaskProjectName(task, projectName);

                return (
                  <li key={task.title}>
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                        isRejected
                          ? "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
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
                  </li>
                );
              })}
            </ul>
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
          if (updateTaskStatusMutation.isPending) {
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
      />
    </>
  );
}
