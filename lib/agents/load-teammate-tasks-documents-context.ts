import type { Db, ObjectId } from "mongodb";
import { attachDocumentStatusToAgentTasks } from "@/lib/agents/agent-tasks-route-helpers";
import { getProjectNameForUser } from "@/lib/agents/agent-tasks-route-helpers";
import {
  AGENT_TASKS_COLLECTION,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import { getAgentDocuments } from "@/lib/agents/agent-documents-store";
import { buildAgentTasksDocumentsContext } from "@/lib/prompts/agent-tasks-documents-context-prompt";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentDocumentResponse, AgentTask } from "@/lib/types";

export type TeammateTaskDocumentEntry = {
  task: AgentTask;
  projectId: string;
  projectName: string | null;
  document: AgentDocumentResponse | null;
};

export async function loadTeammateTaskDocumentEntries(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Promise<TeammateTaskDocumentEntry[]> {
  const [taskRecords, documents] = await Promise.all([
    db
      .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
      .find({ userId, teammateId })
      .toArray(),
    getAgentDocuments(db, userId, teammateId),
  ]);

  if (taskRecords.length === 0) {
    return [];
  }

  const documentsById = new Map(documents.map((document) => [document._id, document]));

  const projectNames = new Map<string, string | null>();

  async function resolveProjectName(projectId: ObjectId): Promise<string | null> {
    const key = projectId.toString();
    if (!projectNames.has(key)) {
      projectNames.set(key, await getProjectNameForUser(db, userId, projectId));
    }
    return projectNames.get(key) ?? null;
  }

  const entries: TeammateTaskDocumentEntry[] = [];

  for (const record of taskRecords) {
    const projectId = record.projectId.toString();
    const projectName = await resolveProjectName(record.projectId);
    const tasks = await attachDocumentStatusToAgentTasks(
      db,
      userId,
      teammateId,
      record.tasks,
    );

    for (const task of tasks) {
      const document = task.outputDocumentId
        ? (documentsById.get(task.outputDocumentId) ?? null)
        : null;

      entries.push({
        task,
        projectId,
        projectName: task.projectName?.trim() || projectName,
        document,
      });
    }
  }

  return entries;
}

export async function loadTeammateTasksDocumentsContext(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Promise<string | undefined> {
  const entries = await loadTeammateTaskDocumentEntries(db, userId, teammateId);
  return buildAgentTasksDocumentsContext(entries);
}
