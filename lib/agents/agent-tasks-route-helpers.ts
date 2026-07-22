import { ObjectId, type Db } from "mongodb";
import { isChatTeammateId, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { StoredAgentTasks } from "@/lib/agents/agent-tasks-store";
import { toIsoString } from "@/lib/dates";
import type { AgentTasksResponse } from "@/lib/types";

export function serializeAgentTasks(
  teammateId: ChatTeammateId,
  projectId: string,
  record: StoredAgentTasks | null,
  projectName: string | null = null,
): AgentTasksResponse {
  const resolvedProjectName = projectName?.trim() || null;
  const tasks = (record?.tasks ?? []).map((task) => ({
    ...task,
    projectName: task.projectName?.trim() || resolvedProjectName || undefined,
  }));

  return {
    teammateId,
    projectId,
    projectName: resolvedProjectName,
    tasks,
    updatedAt: record ? toIsoString(record.updatedAt) : null,
  };
}

export async function getProjectNameForUser(
  db: Db,
  userId: ObjectId,
  projectId: ObjectId,
): Promise<string | null> {
  const project = await db.collection("projects").findOne({
    _id: projectId,
    userId,
  });

  return typeof project?.name === "string" ? project.name : null;
}

export function parseTeammateId(teammateId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  return { teammateId };
}

export function parseProjectId(searchParams: URLSearchParams) {
  const projectId = searchParams.get("projectId")?.trim();

  if (!projectId) {
    return {
      error: Response.json(
        { error: "projectId query parameter is required" },
        { status: 400 },
      ),
    };
  }

  if (!ObjectId.isValid(projectId)) {
    return {
      error: Response.json({ error: "Invalid project id" }, { status: 400 }),
    };
  }

  return { projectId: new ObjectId(projectId), projectIdString: projectId };
}
