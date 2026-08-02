import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getAllAgentTasksForTeammate,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import {
  attachDocumentStatusToAgentTasks,
  getProjectNameForUser,
  serializeAgentTasks,
} from "@/lib/agents/agent-tasks-route-helpers";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { AGENT_TASKS_COLLECTION } from "@/lib/agents/agent-tasks-store";
import type { AgentTasksAllProjectsResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;

    if (!isChatTeammateId(rawTeammateId)) {
      return Response.json({ error: "Invalid teammate id" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();

    const records = await getAllAgentTasksForTeammate(
      db,
      auth.userId,
      rawTeammateId,
    );

    const projectsWithTasks = await Promise.all(
      records.map(async (record) => {
        const projectName = await getProjectNameForUser(
          db,
          auth.userId,
          record.projectId,
        );
        const serialized = serializeAgentTasks(
          rawTeammateId,
          record.projectId.toString(),
          record,
          projectName,
        );
        const tasks = await attachDocumentStatusToAgentTasks(
          db,
          auth.userId,
          rawTeammateId,
          serialized.tasks,
        );
        return { ...serialized, tasks };
      }),
    );

    const response: AgentTasksAllProjectsResponse = {
      teammateId: rawTeammateId,
      projects: projectsWithTasks.filter((p) => p.tasks.length > 0),
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
