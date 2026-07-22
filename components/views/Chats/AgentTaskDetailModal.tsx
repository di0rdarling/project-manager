"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { DeleteAISummaryModal } from "@/components/ui/DeleteAISummaryModal";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";
import { ChatModelSelect } from "@/components/views/Chats/ChatModelSelect";
import {
  getAgentDocumentDetailPath,
} from "@/lib/agents/agent-documents";
import {
  canAccessAgentTaskOutputTabs,
  getAgentTaskOutputStatus,
  getAgentTaskStatus,
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
  getAgentTaskProjectName,
} from "@/lib/agents/agent-tasks";
import {
  appendAgentProfileFrom,
  type AgentProfileFrom,
} from "@/lib/chats/agent-profile-navigation";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import type { AgentTask, AgentTaskStatus } from "@/lib/types";
import type { StartAgentTaskOutputInput } from "@/lib/api/agent-tasks";

type AgentTaskDetailModalProps = {
  open: boolean;
  task: AgentTask | null;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  isUpdating?: boolean;
  canAccept?: boolean;
  projectName?: string | null;
  teammateId?: ChatTeammateId;
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
  onStartOutput?: (input: StartAgentTaskOutputInput) => void;
  isStartingOutput?: boolean;
  isRegeneratingOutput?: boolean;
};

type DetailBlock = {
  key: string;
  label: string;
  icon: typeof LightBulbIcon;
  value: string;
  iconClassName: string;
};

function AgentTaskOverviewContent({
  task,
  blocks,
}: Readonly<{
  task: AgentTask;
  blocks: DetailBlock[];
}>) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {task.detail}
      </p>

      {task.outputDescription ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <DocumentTextIcon
              className="size-4 shrink-0 text-blue-500 dark:text-blue-400"
              aria-hidden
            />
            What I&apos;ll produce
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {task.outputDescription}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {blocks.map(({ key, label, icon: Icon, value, iconClassName }) =>
          value ? (
            <div
              key={key}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <Icon
                  className={`size-4 shrink-0 ${iconClassName}`}
                  aria-hidden
                />
                {label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {value}
              </p>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function AgentTaskOutputNotAccepted() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
      <SparklesIcon
        className="mx-auto size-8 text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        Output will appear after you accept this task
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Once accepted, this teammate will work autonomously and share what
        they produced, their reasoning, and how it completes the task.
      </p>
    </div>
  );
}

function AgentTaskOutputStartPrompt({
  onStart,
  isStarting,
}: Readonly<{
  onStart?: () => void;
  isStarting: boolean;
}>) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
      <SparklesIcon
        className="mx-auto size-8 text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        Ready for this teammate to start
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Ask them to begin working on this task. Once they&apos;re done,
        you&apos;ll see the deliverable, their approach, and how it completes
        the task here.
      </p>
      {onStart ? (
        <Button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="mt-4"
        >
          {isStarting ? "Starting..." : "Ask teammate to start"}
        </Button>
      ) : null}
    </div>
  );
}

function AgentTaskOutputWorking({
  task,
  isRegenerating = false,
}: Readonly<{
  task: AgentTask;
  isRegenerating?: boolean;
}>) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
        <SparklesIcon
          className="mx-auto size-8 animate-pulse text-zinc-400 dark:text-zinc-500"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {isRegenerating
            ? "Teammate is redoing this task"
            : "Teammate is working on this task"}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          When complete, this tab will show the deliverable, the
          teammate&apos;s approach, and how their work fulfils the task.
        </p>
      </div>

      <div className="space-y-4 opacity-60">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <DocumentTextIcon
              className="size-4 shrink-0 text-blue-500 dark:text-blue-400"
              aria-hidden
            />
            Deliverable
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {task.outputDescription || "The document the teammate produces will appear here."}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <LightBulbIcon
              className="size-4 shrink-0 text-amber-500 dark:text-amber-400"
              aria-hidden
            />
            Approach &amp; reasoning
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            The teammate will explain how they tackled the task, the choices
            they made, and the evidence they used from the project context.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <CheckCircleIcon
              className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
              aria-hidden
            />
            How this completes the task
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            A summary of what is now true or unblocked in the project because
            this work is done, tied back to the original task goal.
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentTaskOutputCompleted({
  task,
  teammateId,
  profileFrom,
  profileProjectId,
  onClose,
}: Readonly<{
  task: AgentTask;
  teammateId?: ChatTeammateId;
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
  onClose?: () => void;
}>) {
  const documentHref =
    task.outputDocumentId && teammateId
      ? appendAgentProfileFrom(
          getAgentDocumentDetailPath(teammateId, task.outputDocumentId),
          profileFrom ?? null,
          profileProjectId,
        )
      : null;
  const documentTitle = task.outputDocumentTitle || "Untitled document";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <DocumentTextIcon
            className="size-4 shrink-0 text-blue-500 dark:text-blue-400"
            aria-hidden
          />
          Deliverable
        </p>
        {documentHref ? (
          <Link
            href={documentHref}
            onClick={onClose}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <CheckCircleIcon
              className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
              aria-hidden
            />
            {documentTitle}
          </Link>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <CheckCircleIcon
              className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
              aria-hidden
            />
            {documentTitle}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Saved to this teammate&apos;s Documents, ready for your review.
        </p>
        {documentHref ? (
          <Link
            href={documentHref}
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View document
            <ChevronRightIcon className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <LightBulbIcon
            className="size-4 shrink-0 text-amber-500 dark:text-amber-400"
            aria-hidden
          />
          Approach &amp; reasoning
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {task.outputApproach}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <CheckCircleIcon
            className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
            aria-hidden
          />
          How this completes the task
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {task.outputCompletionSummary}
        </p>
      </div>
    </div>
  );
}

function AgentTaskOutputContent({
  task,
  isAccepted,
  isStarting,
  isRegenerating,
  teammateId,
  profileFrom,
  profileProjectId,
  onStart,
  onClose,
}: Readonly<{
  task: AgentTask;
  isAccepted: boolean;
  isStarting: boolean;
  isRegenerating: boolean;
  teammateId?: ChatTeammateId;
  profileFrom?: AgentProfileFrom | null;
  profileProjectId?: string | null;
  onStart?: () => void;
  onClose?: () => void;
}>) {
  if (!isAccepted) {
    return <AgentTaskOutputNotAccepted />;
  }

  if (isStarting) {
    return (
      <AgentTaskOutputWorking task={task} isRegenerating={isRegenerating} />
    );
  }

  const outputStatus = getAgentTaskOutputStatus(task);

  if (outputStatus === "completed") {
    return (
      <AgentTaskOutputCompleted
        task={task}
        teammateId={teammateId}
        profileFrom={profileFrom}
        profileProjectId={profileProjectId}
        onClose={onClose}
      />
    );
  }

  return (
    <AgentTaskOutputStartPrompt
      onStart={onStart}
      isStarting={isStarting}
    />
  );
}

function AgentTaskReviewPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
      <DocumentTextIcon
        className="mx-auto size-8 text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        Nothing ready for your review yet
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        After the teammate finishes and submits their output, you&apos;ll review
        and sign off on it here before it is added to Documents.
      </p>
    </div>
  );
}

export default function AgentTaskDetailModal({
  open,
  task,
  onClose,
  onAccept,
  onReject,
  isUpdating = false,
  canAccept = true,
  projectName = null,
  teammateId,
  profileFrom = null,
  profileProjectId = null,
  onStartOutput,
  isStartingOutput = false,
  isRegeneratingOutput = false,
}: Readonly<AgentTaskDetailModalProps>) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRedoConfirmOpen, setIsRedoConfirmOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] =
    useState<ChatModelId>(DEFAULT_CHAT_MODEL_ID);
  const previousTaskStatusRef = useRef<AgentTaskStatus | null>(null);

  useEffect(() => {
    if (!open) {
      setIsRedoConfirmOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !task) {
      previousTaskStatusRef.current = null;
      return;
    }

    setActiveTab("overview");
    setSelectedModelId(DEFAULT_CHAT_MODEL_ID);
    previousTaskStatusRef.current = getAgentTaskStatus(task);
  }, [open, task?.title]);

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    const status = getAgentTaskStatus(task);
    const previousStatus = previousTaskStatusRef.current;

    if (
      previousStatus !== null &&
      previousStatus !== status &&
      status === "accepted"
    ) {
      setActiveTab("output");
    }

    previousTaskStatusRef.current = status;
  }, [open, task?.status, task?.title, task]);

  if (!open || !task) {
    return null;
  }

  const taskStatus = getAgentTaskStatus(task);
  const taskProjectName = getAgentTaskProjectName(task, projectName);
  const isAccepted = taskStatus === "accepted";
  const outputStatus = getAgentTaskOutputStatus(task);
  const outputTabsEnabled = canAccessAgentTaskOutputTabs(task);
  const showOverviewActions =
    activeTab === "overview" && Boolean(onAccept || onReject);
  const showOutputRedoAction =
    activeTab === "output" &&
    isAccepted &&
    outputStatus === "completed" &&
    !isStartingOutput &&
    Boolean(onStartOutput);
  const acceptDisabled = isUpdating || (taskStatus !== "accepted" && !canAccept);
  const redoDocumentTitle = task.outputDocumentTitle || "Untitled document";

  function handleRequestRedo() {
    setIsRedoConfirmOpen(true);
  }

  function handleConfirmRedo() {
    setIsRedoConfirmOpen(false);
    onStartOutput?.({ regenerate: true, modelId: selectedModelId });
  }

  function handleStartOutput() {
    onStartOutput?.({ regenerate: false, modelId: selectedModelId });
  }

  const blocks: DetailBlock[] = [
    {
      key: "rationale",
      label: "Why I'm suggesting this",
      icon: LightBulbIcon,
      value: task.rationale,
      iconClassName: "text-amber-500 dark:text-amber-400",
    },
    {
      key: "impact",
      label: "Impact if this gets done",
      icon: ArrowTrendingUpIcon,
      value: task.impact,
      iconClassName: "text-emerald-500 dark:text-emerald-400",
    },
    {
      key: "risk",
      label: "If this is skipped",
      icon: ExclamationTriangleIcon,
      value: task.riskIfSkipped,
      iconClassName: "text-red-500 dark:text-red-400",
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={task.title}
        size="wide"
        secondaryAction={
          showOverviewActions && onReject
            ? {
                label: "Reject",
                onClick: onReject,
                isPending: isUpdating,
                pendingLabel: "Saving...",
                variant: "secondary",
              }
            : undefined
        }
        primaryAction={
          showOverviewActions && onAccept
            ? {
                label: "Accept",
                onClick: onAccept,
                isPending: isUpdating,
                pendingLabel: "Saving...",
                disabled: acceptDisabled,
              }
            : showOutputRedoAction
              ? {
                  label: "Ask teammate to redo",
                  onClick: handleRequestRedo,
                  isPending: isStartingOutput,
                  pendingLabel: "Redoing...",
                  variant: "secondary",
                }
              : undefined
        }
      >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskStatusBadgeClassName(taskStatus)}`}
          >
            {getAgentTaskStatusLabel(taskStatus)}
          </span>
          {taskProjectName ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getAgentTaskProjectBadgeClassName()}`}
            >
              {taskProjectName}
            </span>
          ) : null}
          {taskStatus !== "pending" && activeTab === "overview" ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You can change your decision below. Rejected tasks are replaced
              when you generate more.
            </p>
          ) : null}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="overview"
          className="space-y-5"
        >
          <TabsList aria-label="Task details">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="output" disabled={!outputTabsEnabled}>
              Output
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!outputTabsEnabled}>
              Review
            </TabsTrigger>
          </TabsList>

          <TabsPanel value="overview">
            <AgentTaskOverviewContent task={task} blocks={blocks} />
          </TabsPanel>

          <TabsPanel value="output">
            {isAccepted && !isStartingOutput ? (
              <div className="mb-5 flex justify-end">
                <div className="w-28 shrink-0 sm:w-36 md:w-44">
                  <ChatModelSelect
                    id={`agent-task-output-model-${task.title}`}
                    value={selectedModelId}
                    onChange={setSelectedModelId}
                  />
                </div>
              </div>
            ) : null}
            <AgentTaskOutputContent
              task={task}
              isAccepted={isAccepted}
              isStarting={isStartingOutput}
              isRegenerating={isRegeneratingOutput}
              teammateId={teammateId}
              profileFrom={profileFrom}
              profileProjectId={profileProjectId}
              onStart={onStartOutput ? handleStartOutput : undefined}
              onClose={onClose}
            />
          </TabsPanel>

          <TabsPanel value="review">
            <AgentTaskReviewPlaceholder />
          </TabsPanel>
        </Tabs>
      </div>
    </Modal>

      <DeleteAISummaryModal
        open={isRedoConfirmOpen}
        title="Redo this task?"
        description={`The current document "${redoDocumentTitle}" will be deleted. The teammate will produce a new document to replace it. Are you sure you want to continue?`}
        confirmLabel="Ask teammate to redo"
        pendingLabel="Starting..."
        isPending={false}
        error={null}
        onClose={() => setIsRedoConfirmOpen(false)}
        onConfirm={handleConfirmRedo}
      />
    </>
  );
}
