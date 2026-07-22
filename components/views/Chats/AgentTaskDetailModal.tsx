"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";
import {
  canAccessAgentTaskOutputTabs,
  getAgentTaskStatus,
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
  getAgentTaskProjectName,
} from "@/lib/agents/agent-tasks";
import type { AgentTask, AgentTaskOutputFormat, AgentTaskStatus } from "@/lib/types";

type AgentTaskDetailModalProps = {
  open: boolean;
  task: AgentTask | null;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  isUpdating?: boolean;
  canAccept?: boolean;
  projectName?: string | null;
};

type DetailBlock = {
  key: string;
  label: string;
  icon: typeof LightBulbIcon;
  value: string;
  iconClassName: string;
};

const OUTPUT_FORMAT_LABELS: Record<AgentTaskOutputFormat, string> = {
  note: "New note",
  document: "New document",
};

function AgentTaskOverviewContent({
  task,
  blocks,
  outputFormatLabel,
}: Readonly<{
  task: AgentTask;
  blocks: DetailBlock[];
  outputFormatLabel: string;
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
          <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
            {outputFormatLabel}
          </span>
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

function AgentTaskOutputPlaceholder({
  task,
  outputFormatLabel,
  isAccepted,
}: Readonly<{
  task: AgentTask;
  outputFormatLabel: string;
  isAccepted: boolean;
}>) {
  if (!isAccepted) {
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
        <SparklesIcon
          className="mx-auto size-8 text-zinc-400 dark:text-zinc-500"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Teammate is working on this task
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
          <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
            {outputFormatLabel}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {task.outputDescription || "The note or document the teammate produces will appear here."}
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
}: Readonly<AgentTaskDetailModalProps>) {
  const [activeTab, setActiveTab] = useState("overview");
  const previousTaskStatusRef = useRef<AgentTaskStatus | null>(null);

  useEffect(() => {
    if (!open || !task) {
      previousTaskStatusRef.current = null;
      return;
    }

    setActiveTab("overview");
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
  const outputTabsEnabled = canAccessAgentTaskOutputTabs(task);
  const showActions =
    activeTab === "overview" && Boolean(onAccept || onReject);
  const acceptDisabled = isUpdating || (taskStatus !== "accepted" && !canAccept);

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

  const outputFormatLabel =
    OUTPUT_FORMAT_LABELS[task.outputFormat] ?? OUTPUT_FORMAT_LABELS.note;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task.title}
      size="wide"
      secondaryAction={
        showActions && onReject
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
        showActions && onAccept
          ? {
              label: "Accept",
              onClick: onAccept,
              isPending: isUpdating,
              pendingLabel: "Saving...",
              disabled: acceptDisabled,
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
            <AgentTaskOverviewContent
              task={task}
              blocks={blocks}
              outputFormatLabel={outputFormatLabel}
            />
          </TabsPanel>

          <TabsPanel value="output">
            <AgentTaskOutputPlaceholder
              task={task}
              outputFormatLabel={outputFormatLabel}
              isAccepted={isAccepted}
            />
          </TabsPanel>

          <TabsPanel value="review">
            <AgentTaskReviewPlaceholder />
          </TabsPanel>
        </Tabs>
      </div>
    </Modal>
  );
}
