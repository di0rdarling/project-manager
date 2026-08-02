import { CHAT_TEAMMATES } from "@/lib/chats/chat-teammates";
import { getAllAgentTasksForUser } from "@/lib/agents/agent-tasks-store";
import {
  attachDocumentStatusToAgentTasks,
  getProjectNameForUser,
} from "@/lib/agents/agent-tasks-route-helpers";
import { getAgentTaskStatus } from "@/lib/agents/agent-tasks";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { toIsoString } from "@/lib/dates";
import type { DashboardTasksResponse, DashboardTaskItem } from "@/lib/types";

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  in_review: 1,
  accepted: 2,
  completed: 3,
};

function sortDashboardTasks(items: DashboardTaskItem[]): DashboardTaskItem[] {
  return [...items].sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (orderDiff !== 0) return orderDiff;
    if (a.updatedAt && b.updatedAt) {
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return 0;
  });
}

export async function GET() {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const client = await getClientPromise();
    const db = client.db();

    const records = await getAllAgentTasksForUser(db, auth.userId);

    const teammateById = new Map(
      CHAT_TEAMMATES.map((t) => [t.id, t]),
    );

    const tasks: DashboardTaskItem[] = [];
    const completedTasks: DashboardTaskItem[] = [];

    for (const record of records) {
      const teammate = teammateById.get(record.teammateId);
      if (!teammate) continue;

      const projectName = await getProjectNameForUser(
        db,
        auth.userId,
        record.projectId,
      );

      const tasksWithDocumentStatus = await attachDocumentStatusToAgentTasks(
        db,
        auth.userId,
        record.teammateId,
        record.tasks,
      );

      for (const task of tasksWithDocumentStatus) {
        const status = getAgentTaskStatus(task);
        if (status === "rejected") continue;

        const item: DashboardTaskItem = {
          title: task.title,
          detail: task.detail,
          status,
          teammateId: record.teammateId,
          teammateName: teammate.name,
          teammateAvatarInitials: teammate.avatarInitials,
          teammateAvatarImageSrc: teammate.avatarImageSrc,
          teammateAvatarColorClassName: teammate.avatarColorClassName,
          projectId: record.projectId.toString(),
          projectName: task.projectName?.trim() || projectName || null,
          outputDocumentId: task.outputDocumentId,
          outputDocumentStatus: task.outputDocumentStatus,
          updatedAt: record.updatedAt ? toIsoString(record.updatedAt) : null,
        };

        if (status === "completed") {
          completedTasks.push(item);
        } else {
          tasks.push(item);
        }
      }
    }

    const response: DashboardTasksResponse = {
      tasks: sortDashboardTasks(tasks),
      completedTasks: sortDashboardTasks(completedTasks),
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
