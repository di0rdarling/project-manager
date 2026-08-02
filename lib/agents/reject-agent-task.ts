import { ObjectId, type Db } from "mongodb";
import {
  deleteAgentDocument,
} from "@/lib/agents/agent-documents-store";
import {
  findAgentTaskByDocumentId,
  getAgentTasks,
  upsertAgentTasks,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTask } from "@/lib/types";

async function deleteTaskOutputDocument(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  task: AgentTask,
): Promise<void> {
  if (!task.outputDocumentId || !ObjectId.isValid(task.outputDocumentId)) {
    return;
  }

  await deleteAgentDocument(
    db,
    userId,
    teammateId,
    new ObjectId(task.outputDocumentId),
  );
}

export async function removeAgentTaskByTitle(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
  updatedAt: string = new Date().toISOString(),
): Promise<{ removedTask: AgentTask | null; record: StoredAgentTasks | null }> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);

  if (!record) {
    return { removedTask: null, record: null };
  }

  const removedTask =
    record.tasks.find((task) => task.title === taskTitle) ?? null;

  if (!removedTask) {
    return { removedTask: null, record };
  }

  const tasks = record.tasks.filter((task) => task.title !== taskTitle);
  const updatedRecord = await upsertAgentTasks(
    db,
    userId,
    teammateId,
    projectId,
    { tasks },
    updatedAt,
  );

  return { removedTask, record: updatedRecord };
}

export async function rejectAndDeleteAgentTaskByTitle(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
): Promise<{ removedTask: AgentTask | null; record: StoredAgentTasks | null }> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);
  const task = record?.tasks.find((entry) => entry.title === taskTitle) ?? null;

  if (!task) {
    return { removedTask: null, record: record ?? null };
  }

  await deleteTaskOutputDocument(db, userId, teammateId, task);

  return removeAgentTaskByTitle(
    db,
    userId,
    teammateId,
    projectId,
    taskTitle,
  );
}

export async function rejectAndDeleteAgentTaskByDocumentId(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: string,
): Promise<{
  removedTask: AgentTask | null;
  record: StoredAgentTasks | null;
  projectId: ObjectId | null;
}> {
  const linkedTask = await findAgentTaskByDocumentId(
    db,
    userId,
    teammateId,
    documentId,
  );

  if (ObjectId.isValid(documentId)) {
    await deleteAgentDocument(
      db,
      userId,
      teammateId,
      new ObjectId(documentId),
    );
  }

  if (!linkedTask) {
    return { removedTask: null, record: null, projectId: null };
  }

  const { removedTask, record } = await removeAgentTaskByTitle(
    db,
    userId,
    teammateId,
    linkedTask.projectId,
    linkedTask.task.title,
  );

  return {
    removedTask: removedTask ?? linkedTask.task,
    record,
    projectId: linkedTask.projectId,
  };
}
