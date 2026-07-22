import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTasksDraft } from "@/lib/agents/agent-tasks-json";
import { EMPTY_AGENT_TASKS_DRAFT } from "@/lib/agents/agent-tasks-json";
import type { AgentTaskOutputDraft } from "@/lib/agents/agent-task-output-json";
import type { AgentTask, AgentTaskStatus } from "@/lib/types";

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
  status: AgentTaskStatus,
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

export async function updateAgentTaskOutput(
  db: Db,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
  output: AgentTaskOutputDraft,
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
          outputContent: output.content,
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
