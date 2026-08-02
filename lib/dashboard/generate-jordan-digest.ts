import type { Db, ObjectId } from "mongodb";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import {
  AGENT_TASKS_COLLECTION,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import { getChatTeammate, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getOtherTeammatesRecentChatSummaries,
  getTeammateChatSummaries,
} from "@/lib/chats/chat-summaries";
import type { ChatModelId } from "@/lib/chats/chat-models";
import { generateChatReply } from "@/lib/chat-generation";
import { getAllProjectsContext } from "@/lib/project-context";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import type { DashboardDigestResponse } from "@/lib/types";
import type { StoredProject } from "@/lib/serialize/serialize-project";

function parseDashboardDigestJson(text: string): DashboardDigestResponse {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const digest =
    typeof parsed.digest === "string" ? parsed.digest.trim() : "";
  const suggestedAction =
    typeof parsed.suggestedAction === "string"
      ? parsed.suggestedAction.trim()
      : "";

  if (!digest || !suggestedAction) {
    throw new Error("Dashboard digest response is missing required fields");
  }

  return { digest, suggestedAction };
}

type NormalizedTask = {
  title: string;
  detail: string;
  status: string;
  isComplete: boolean;
  needsUserAttention: boolean;
  teammateName: string;
  teammateRole: string;
  projectName: string;
  rationale?: string;
  impact?: string;
  riskIfSkipped?: string;
};

function normalizeTaskStatus(
  status: string | undefined,
  outputStatus: string | undefined,
): { label: string; isComplete: boolean; needsUserAttention: boolean } {
  if (outputStatus === "completed") {
    return { label: "completed", isComplete: true, needsUserAttention: false };
  }

  if (status === "accepted") {
    return {
      label: "accepted — in progress",
      isComplete: false,
      needsUserAttention: false,
    };
  }

  if (status === "in_review") {
    return {
      label: "in review — waiting for my decision",
      isComplete: false,
      needsUserAttention: true,
    };
  }

  if (status === "rejected") {
    return { label: "rejected", isComplete: true, needsUserAttention: false };
  }

  if (status === "pending") {
    return {
      label: "pending my decision",
      isComplete: false,
      needsUserAttention: true,
    };
  }

  return {
    label: "suggested — awaiting my decision",
    isComplete: false,
    needsUserAttention: true,
  };
}

async function buildAgentTasksContext(
  db: Db,
  userId: ObjectId,
): Promise<string | undefined> {
  const [taskRecords, projects] = await Promise.all([
    db
      .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray(),
    db
      .collection<StoredProject>("projects")
      .find({ userId })
      .toArray(),
  ]);

  const allTasks: NormalizedTask[] = [];

  for (const record of taskRecords) {
    const teammate = getChatTeammate(record.teammateId as ChatTeammateId);
    const projectName =
      projects.find((project) => project._id.equals(record.projectId))?.name ??
      "Unknown project";

    for (const task of record.tasks) {
      const statusMeta = normalizeTaskStatus(task.status, task.outputStatus);

      allTasks.push({
        title: task.title?.trim() || "Untitled task",
        detail: task.detail?.trim() || "",
        status: statusMeta.label,
        isComplete: statusMeta.isComplete,
        needsUserAttention: statusMeta.needsUserAttention,
        teammateName: teammate.name,
        teammateRole: teammate.role,
        projectName,
        rationale: task.rationale?.trim(),
        impact: task.impact?.trim(),
        riskIfSkipped: task.riskIfSkipped?.trim(),
      });
    }
  }

  if (allTasks.length === 0) {
    return undefined;
  }

  const incompleteTasks = allTasks.filter((task) => !task.isComplete);
  const completedTasks = allTasks.filter((task) => task.isComplete);

  const lines: string[] = [];

  lines.push(
    "=== Autonomous tasks across your AI teammates ===",
    "",
    "These are tasks your AI teammates have suggested or are working on. Each task is owned by a specific teammate (listed by name and role) and linked to a project.",
    "",
    "Tasks marked as needing my decision are the highest priority for the digest — they are blocked on me, not on the agent.",
  );

  if (incompleteTasks.length > 0) {
    lines.push(
      "",
      "--- Incomplete or in-progress tasks (prioritise these) ---",
      "",
    );

    const groupedByTeammate = groupBy(incompleteTasks, (task) => task.teammateName);

    for (const [teammateName, tasks] of Object.entries(groupedByTeammate)) {
      const teammate = tasks[0];
      lines.push(`## ${teammateName} (${teammate?.teammateRole})`);

      for (const task of tasks) {
        lines.push(
          `- ${task.title} [${task.status}] — Project: ${task.projectName}`,
        );

        if (task.detail) {
          lines.push(`  What it is: ${task.detail}`);
        }
        if (task.rationale) {
          lines.push(`  Why it matters: ${task.rationale}`);
        }
        if (task.impact) {
          lines.push(`  Impact if done: ${task.impact}`);
        }
        if (task.riskIfSkipped) {
          lines.push(`  Risk if skipped: ${task.riskIfSkipped}`);
        }
      }
    }
  }

  if (completedTasks.length > 0) {
    lines.push(
      "",
      "--- Completed or rejected tasks (for awareness only) ---",
      "",
    );

    for (const task of completedTasks) {
      lines.push(
        `- ${task.title} [${task.status}] — ${task.teammateName}, Project: ${task.projectName}`,
      );
    }
  }

  return lines.join("\n");
}

function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (groups, item) => {
      const key = keyFn(item);
      groups[key] = groups[key] ?? [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
}

function buildDigestUserMessage(agentTasksContext: string | undefined): string {
  const sections = [
    "Give me a substantive cross-project status update and one concrete next action I should take.",
    "",
    "Use all of the context you have: my projects, recent conversations, what my other AI teammates have been working on with me, and the autonomous tasks below.",
    "",
    "Pay special attention to tasks that need my decision (pending, suggested, or in_review). These are blocked on me, so they are strong candidates for the next action. If a task needs my decision, say so explicitly and name the agent I should talk to about it.",
    "",
    "If an accepted task is in progress, acknowledge it briefly. If there are no urgent decisions, suggest the single best way I can make progress right now — often that means opening a chat with the relevant teammate to move a task forward.",
  ];

  if (agentTasksContext?.trim()) {
    sections.push("", agentTasksContext.trim());
  } else {
    sections.push(
      "",
      "No autonomous tasks have been suggested yet across my teammates.",
    );
  }

  sections.push(
    "",
    "Return your response as a single JSON object with no markdown, code fences, or extra commentary. Use this exact shape:",
    "",
    '{"digest": "3-5 substantial sentences summarizing what\'s most important across my projects. Include: (1) what has moved forward recently, (2) what is stalled or blocked and why, (3) any decisions or follow-ups from my conversations that still need resolution, (4) patterns or risks spanning multiple projects. Be specific — name projects, teammates, and deliverables where relevant.", "suggestedAction": "one specific next step I should take"}',
  );

  return sections.join("\n");
}

export async function generateJordanDashboardDigest(
  db: Db,
  userId: ObjectId,
  userName: string | null,
  modelId: ChatModelId,
): Promise<DashboardDigestResponse> {
  const teammateId = "jordan";

  const [
    projectContext,
    otherChatSummaries,
    otherTeammatesChatSummaries,
    agentNotesContext,
    agentTasksContext,
  ] = await Promise.all([
    getAllProjectsContext(db, userId),
    getTeammateChatSummaries(db, userId, teammateId, {
      excludeArchived: true,
      limit: 5,
    }),
    getOtherTeammatesRecentChatSummaries(db, userId, teammateId, 5),
    loadAgentNotesContext(db, userId, teammateId),
    buildAgentTasksContext(db, userId),
  ]);

  const otherConversationsContext =
    buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;
  const otherTeammatesContext =
    buildOtherTeammatesContext(otherTeammatesChatSummaries) ?? undefined;

  const userMessage = buildDigestUserMessage(agentTasksContext);

  const result = await generateChatReply(
    [],
    userMessage,
    teammateId,
    projectContext ?? undefined,
    otherConversationsContext,
    otherTeammatesContext,
    agentNotesContext,
    userName,
    modelId,
    undefined,
    new Date(),
  );

  return parseDashboardDigestJson(result.content);
}
