import { ObjectId, type Db } from "mongodb";
import { AGENT_DOCUMENTS_COLLECTION } from "@/lib/agents/agent-documents-store";
import { isChatTeammateId, type ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { StoredAgentTasks } from "@/lib/agents/agent-tasks-store";
import { toIsoString } from "@/lib/dates";
import type { AgentDocumentStatus, AgentTask, AgentTasksResponse } from "@/lib/types";

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

export async function attachDocumentStatusToAgentTasks(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  tasks: AgentTask[],
): Promise<AgentTask[]> {
  const documentIds = tasks
    .map((task) => task.outputDocumentId)
    .filter((id): id is string => Boolean(id && ObjectId.isValid(id)));

  if (documentIds.length === 0) {
    return tasks;
  }

  const documents = await db
    .collection(AGENT_DOCUMENTS_COLLECTION)
    .find({
      _id: { $in: documentIds.map((id) => new ObjectId(id)) },
      userId,
      teammateId,
    })
    .project({ _id: 1, status: 1 })
    .toArray();

  const statusById = new Map(
    documents.map((document) => [
      document._id.toString(),
      document.status as AgentDocumentStatus,
    ]),
  );

  return tasks.map((task) => {
    if (!task.outputDocumentId) {
      return task;
    }

    const outputDocumentStatus = statusById.get(task.outputDocumentId);

    if (!outputDocumentStatus) {
      return task;
    }

    return { ...task, outputDocumentStatus };
  });
}

export async function serializeAgentTasksResponse(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: string,
  record: StoredAgentTasks | null,
  projectName: string | null = null,
): Promise<AgentTasksResponse> {
  const response = serializeAgentTasks(
    teammateId,
    projectId,
    record,
    projectName,
  );
  const tasks = await attachDocumentStatusToAgentTasks(
    db,
    userId,
    teammateId,
    response.tasks,
  );

  return { ...response, tasks };
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
