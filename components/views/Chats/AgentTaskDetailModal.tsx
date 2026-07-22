"use client";

import {
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/components/ui/Modal";
import {
  getAgentTaskStatus,
  getAgentTaskStatusBadgeClassName,
  getAgentTaskStatusLabel,
  getAgentTaskProjectBadgeClassName,
  getAgentTaskProjectName,
} from "@/lib/agents/agent-tasks";
import type { AgentTask, AgentTaskOutputFormat } from "@/lib/types";

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
  if (!open || !task) {
    return null;
  }

  const taskStatus = getAgentTaskStatus(task);
  const taskProjectName = getAgentTaskProjectName(task, projectName);
  const showActions = Boolean(onAccept || onReject);
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
          {taskStatus !== "pending" ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You can change your decision below. Rejected tasks are replaced
              when you generate more.
            </p>
          ) : null}
        </div>

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
    </Modal>
  );
}
