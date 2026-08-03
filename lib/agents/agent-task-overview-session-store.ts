import type { Db, ObjectId } from "mongodb";
import {
  DEFAULT_CHAT_MODEL_ID,
  isChatModelId,
  type ChatModelId,
} from "@/lib/chats/chat-models";
import {
  DEFAULT_KIMI_REASONING_EFFORT,
  isKimiReasoningEffort,
  type KimiReasoningEffort,
} from "@/lib/chats/kimi-reasoning-effort";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import { toIsoString } from "@/lib/dates";

export const AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION =
  "agent_task_overview_sessions";

type StoredTaskOverviewSession = {
  _id: ObjectId;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
  modelId: ChatModelId;
  reasoningEffort?: KimiReasoningEffort | null;
  conversationSummary: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type AgentTaskOverviewSessionResponse = {
  modelId: ChatModelId;
  reasoningEffort: KimiReasoningEffort | null;
  conversationSummary: string | null;
  updatedAt: string;
};

function serializeTaskOverviewSession(
  session: StoredTaskOverviewSession,
): AgentTaskOverviewSessionResponse {
  return {
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort ?? null,
    conversationSummary: session.conversationSummary,
    updatedAt: toIsoString(session.updatedAt),
  };
}

type TaskOverviewSessionKey = {
  userId: ObjectId;
  teammateId: ChatTeammateId;
  projectId: ObjectId;
  taskTitle: string;
};

export async function renameTaskOverviewSessionTaskTitle(
  db: Db,
  key: TaskOverviewSessionKey,
  nextTaskTitle: string,
  updatedAt: string = new Date().toISOString(),
): Promise<void> {
  await db.collection(AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION).updateOne(
    {
      userId: key.userId,
      teammateId: key.teammateId,
      projectId: key.projectId,
      taskTitle: key.taskTitle,
    },
    {
      $set: {
        taskTitle: nextTaskTitle,
        updatedAt,
      },
    },
  );
}

export async function getOrCreateTaskOverviewSession(
  db: Db,
  key: TaskOverviewSessionKey,
  defaultModelId: ChatModelId = DEFAULT_CHAT_MODEL_ID,
): Promise<AgentTaskOverviewSessionResponse> {
  const existing = await db
    .collection<StoredTaskOverviewSession>(
      AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION,
    )
    .findOne({
      userId: key.userId,
      teammateId: key.teammateId,
      projectId: key.projectId,
      taskTitle: key.taskTitle,
    });

  if (existing) {
    return serializeTaskOverviewSession(existing);
  }

  const now = new Date().toISOString();
  const session: Omit<StoredTaskOverviewSession, "_id"> = {
    userId: key.userId,
    teammateId: key.teammateId,
    projectId: key.projectId,
    taskTitle: key.taskTitle,
    modelId: defaultModelId,
    reasoningEffort:
      defaultModelId === "kimi-k3" ? DEFAULT_KIMI_REASONING_EFFORT : null,
    conversationSummary: null,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db
    .collection<Omit<StoredTaskOverviewSession, "_id">>(
      AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION,
    )
    .insertOne(session);

  return serializeTaskOverviewSession({
    ...session,
    _id: insertResult.insertedId,
  });
}

export async function updateTaskOverviewSessionSettings(
  db: Db,
  key: TaskOverviewSessionKey,
  settings: {
    modelId?: ChatModelId;
    reasoningEffort?: KimiReasoningEffort | null;
  },
  defaultModelId: ChatModelId = DEFAULT_CHAT_MODEL_ID,
): Promise<AgentTaskOverviewSessionResponse> {
  const session = await getOrCreateTaskOverviewSession(
    db,
    key,
    defaultModelId,
  );

  const nextModelId = settings.modelId ?? session.modelId;
  const nextReasoningEffort =
    settings.reasoningEffort !== undefined
      ? settings.reasoningEffort
      : nextModelId === "kimi-k3"
        ? (session.reasoningEffort ?? DEFAULT_KIMI_REASONING_EFFORT)
        : null;

  const now = new Date().toISOString();

  await db.collection(AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION).updateOne(
    {
      userId: key.userId,
      teammateId: key.teammateId,
      projectId: key.projectId,
      taskTitle: key.taskTitle,
    },
    {
      $set: {
        modelId: nextModelId,
        reasoningEffort: nextReasoningEffort,
        updatedAt: now,
      },
    },
  );

  return {
    ...session,
    modelId: nextModelId,
    reasoningEffort: nextReasoningEffort,
    updatedAt: now,
  };
}

export async function updateTaskOverviewSessionSummary(
  db: Db,
  key: TaskOverviewSessionKey,
  conversationSummary: string,
  updatedAt: string = new Date().toISOString(),
): Promise<void> {
  await db.collection(AGENT_TASK_OVERVIEW_SESSIONS_COLLECTION).updateOne(
    {
      userId: key.userId,
      teammateId: key.teammateId,
      projectId: key.projectId,
      taskTitle: key.taskTitle,
    },
    {
      $set: {
        conversationSummary,
        updatedAt,
      },
    },
  );
}

export function parseTaskOverviewModelId(value: unknown): ChatModelId | null {
  return isChatModelId(value) ? value : null;
}

export function parseTaskOverviewReasoningEffort(
  value: unknown,
): KimiReasoningEffort | null {
  return isKimiReasoningEffort(value) ? value : null;
}
