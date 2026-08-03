import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTasksDraft } from "@/lib/agents/agent-tasks-json";
import { EMPTY_AGENT_TASKS_DRAFT } from "@/lib/agents/agent-tasks-json";
import type { ChatModelId } from "@/lib/chats/chat-models";
import type { UpdateAgentTaskToolArgs } from "@/lib/agents/agent-task-edit-tool";
import type { AgentTask, AgentTaskDecisionStatus } from "@/lib/types";

export const AGENT_TASKS_COLLECTION = "agent_tasks";

export type StoredAgentTasks = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  tasks: AgentTask[];
  updatedAt: string | Date;
};

export async function getAgentTasks(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
): Promise<StoredAgentTasks | null> {
  return db.collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION).findOne({
    userId,
    teammateId,
    projectId,
  });
}

export async function upsertAgentTasks(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  draft: AgentTasksDraft,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredAgentTasks> {
  const record: StoredAgentTasks = {
    userId,
    teammateId,
    projectId,
    tasks: draft.tasks,
    updatedAt,
  };

  await db.collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION).updateOne(
    { userId, teammateId, projectId },
    { $set: record },
    { upsert: true },
  );

  return record;
}

export async function clearAgentTasks(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredAgentTasks> {
  return upsertAgentTasks(
    db,
    userId,
    teammateId,
    projectId,
    EMPTY_AGENT_TASKS_DRAFT,
    updatedAt,
  );
}

export async function updateAgentTaskStatus(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
  status: AgentTaskDecisionStatus,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredAgentTasks | null> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);

  if (!record) {
    return null;
  }

  const taskIndex = record.tasks.findIndex((task) => task.title === taskTitle);

  if (taskIndex === -1) {
    return null;
  }

  const tasks = record.tasks.map((task, index) =>
    index === taskIndex ? { ...task, status } : task,
  );

  return upsertAgentTasks(
    db,
    userId,
    teammateId,
    projectId,
    { tasks },
    updatedAt,
  );
}

export async function updateAgentTaskFields(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
  updates: UpdateAgentTaskToolArgs,
  updatedAt: string = new Date().toISOString(),
): Promise<{ task: AgentTask; previousTitle: string } | null> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);

  if (!record) {
    return null;
  }

  const taskIndex = record.tasks.findIndex((task) => task.title === taskTitle);

  if (taskIndex === -1) {
    return null;
  }

  const currentTask = record.tasks[taskIndex];
  const nextTitle = updates.title ?? currentTask.title;

  if (nextTitle !== currentTask.title) {
    const hasDuplicateTitle = record.tasks.some(
      (task, index) => index !== taskIndex && task.title === nextTitle,
    );

    if (hasDuplicateTitle) {
      throw new Error("A task with this title already exists in this project.");
    }
  }

  const nextTask: AgentTask = {
    ...currentTask,
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.detail !== undefined ? { detail: updates.detail } : {}),
    ...(updates.rationale !== undefined ? { rationale: updates.rationale } : {}),
    ...(updates.impact !== undefined ? { impact: updates.impact } : {}),
    ...(updates.riskIfSkipped !== undefined
      ? { riskIfSkipped: updates.riskIfSkipped }
      : {}),
    ...(updates.outputDescription !== undefined
      ? { outputDescription: updates.outputDescription }
      : {}),
    ...(updates.projectName !== undefined
      ? { projectName: updates.projectName }
      : {}),
  };

  const tasks = record.tasks.map((task, index) =>
    index === taskIndex ? nextTask : task,
  );

  await upsertAgentTasks(
    db,
    userId,
    teammateId,
    projectId,
    { tasks },
    updatedAt,
  );

  return { task: nextTask, previousTitle: currentTask.title };
}

export type AgentTaskOutputResult = {
  documentId: string;
  documentTitle: string;
  modelId: ChatModelId;
  approach: string;
  completionSummary: string;
};

export async function findAgentTaskByTitle(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
): Promise<AgentTask | null> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);
  return record?.tasks.find((task) => task.title === taskTitle) ?? null;
}

export async function findAgentTaskByDocumentId(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: string,
): Promise<{ task: AgentTask; projectId: ObjectId } | null> {
  const records = await db
    .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
    .find({ userId, teammateId })
    .toArray();

  for (const record of records) {
    const task = record.tasks.find(
      (entry) => entry.outputDocumentId === documentId,
    );

    if (task) {
      return { task, projectId: record.projectId };
    }
  }

  return null;
}

export async function updateAgentTaskOutput(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
  output: AgentTaskOutputResult,
  updatedAt: string = new Date().toISOString(),
): Promise<StoredAgentTasks | null> {
  const record = await getAgentTasks(db, userId, teammateId, projectId);

  if (!record) {
    return null;
  }

  const taskIndex = record.tasks.findIndex((task) => task.title === taskTitle);

  if (taskIndex === -1) {
    return null;
  }

  const tasks = record.tasks.map((task, index) =>
    index === taskIndex
      ? {
          ...task,
          outputStatus: "completed" as const,
          outputDocumentId: output.documentId,
          outputDocumentTitle: output.documentTitle,
          outputModelId: output.modelId,
          outputApproach: output.approach,
          outputCompletionSummary: output.completionSummary,
        }
      : task,
  );

  return upsertAgentTasks(
    db,
    userId,
    teammateId,
    projectId,
    { tasks },
    updatedAt,
  );
}

export async function getAllAgentTasksForTeammate(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
): Promise<StoredAgentTasks[]> {
  return db
    .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
    .find({ userId, teammateId })
    .toArray();
}

export async function getAllAgentTasksForUser(
  db: Db,
  userId: ObjectId,
): Promise<StoredAgentTasks[]> {
  return db
    .collection<StoredAgentTasks>(AGENT_TASKS_COLLECTION)
    .find({ userId })
    .toArray();
}
