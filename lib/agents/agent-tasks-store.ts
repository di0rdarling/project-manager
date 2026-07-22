import type { Db, ObjectId } from "mongodb";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type { AgentTasksDraft } from "@/lib/agents/agent-tasks-json";
import { EMPTY_AGENT_TASKS_DRAFT } from "@/lib/agents/agent-tasks-json";
import type { AgentTask } from "@/lib/types";

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
