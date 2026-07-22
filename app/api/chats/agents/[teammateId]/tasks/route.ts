import { ObjectId, type Db } from "mongodb";
import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { parseAgentTasksJson } from "@/lib/agents/agent-tasks-json";
import {
  canAcceptAgentTask,
  canGenerateAgentTasks,
  getAcceptedAgentTasks,
  getAgentTaskGenerationSlots,
  mergeGeneratedAgentTasks,
  normalizeAgentTasksProjectName,
  parseAgentTaskStatus,
} from "@/lib/agents/agent-tasks";
import { AGENT_TASK_COUNT } from "@/lib/agents/agent-tasks-json";
import {
  clearAgentTasks,
  getAgentTasks,
  updateAgentTaskStatus,
  upsertAgentTasks,
  type StoredAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import { serializeUserMemoryForPrompt } from "@/lib/agents/user-memory-json";
import { getUserMemory } from "@/lib/agents/user-memory-store";
import {
  getTeammateChatSummaries,
  RECENT_CHAT_SUMMARY_LIMIT,
} from "@/lib/chats/chat-summaries";
import { requireUserId } from "@/lib/current-user";
import { toIsoString } from "@/lib/dates";
import { generateAgentTasks } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { getProjectContext } from "@/lib/project-context";
import { buildAgentTasksPrompt } from "@/lib/prompts/agent-tasks-prompt";
import { findUserById } from "@/lib/users";
import type { AgentTasksResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

function serializeAgentTasks(
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

async function getProjectNameForUser(
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

function parseTeammateId(teammateId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  return { teammateId };
}

function parseProjectId(searchParams: URLSearchParams) {
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

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsedTeammate = parseTeammateId(rawTeammateId);

    if ("error" in parsedTeammate) {
      return parsedTeammate.error;
    }

    const parsedProject = parseProjectId(new URL(request.url).searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectName = await getProjectNameForUser(
      db,
      auth.userId,
      parsedProject.projectId,
    );
    const record = await getAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        record,
        projectName,
      ),
    );
  } catch {
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsedTeammate = parseTeammateId(rawTeammateId);

    if ("error" in parsedTeammate) {
      return parsedTeammate.error;
    }

    const parsedProject = parseProjectId(new URL(request.url).searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectContext = await getProjectContext(
      db,
      auth.userId,
      parsedProject.projectId,
    );

    if (!projectContext) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await db.collection("projects").findOne({
      _id: parsedProject.projectId,
      userId: auth.userId,
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const existingRecord = await getAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );
    const existingTasks = existingRecord?.tasks ?? [];

    if (!canGenerateAgentTasks(existingTasks)) {
      return Response.json(
        {
          error:
            "All task slots are filled with accepted tasks. Clear tasks or wait for accepted work to complete before generating more.",
        },
        { status: 409 },
      );
    }

    const acceptedTasks = getAcceptedAgentTasks(existingTasks);
    const taskCount = getAgentTaskGenerationSlots(existingTasks);

    const chatSummaries = await getTeammateChatSummaries(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      {
        projectId: parsedProject.projectId,
        limit: RECENT_CHAT_SUMMARY_LIMIT,
      },
    );

    // Same standing notes and structured Overview a live chat reply from
    // this teammate would have available — kept identical here so task
    // suggestions never miss context the agent would otherwise know.
    const [agentNotesContext, existingUserMemory, currentUser] = await Promise.all([
      loadAgentNotesContext(db, auth.userId, parsedTeammate.teammateId),
      getUserMemory(db, auth.userId, parsedTeammate.teammateId),
      findUserById(db, auth.userId),
    ]);
    const existingOverviewContext = existingUserMemory
      ? serializeUserMemoryForPrompt(existingUserMemory)
      : undefined;

    const userName = currentUser?.name ?? null;
    const teammate = getChatTeammate(parsedTeammate.teammateId);
    const generatedAt = new Date();
    const draft = parseAgentTasksJson(
      await generateAgentTasks(
        buildAgentTasksPrompt({
          teammateId: parsedTeammate.teammateId,
          agentName: teammate.name,
          agentRole: teammate.role,
          projectName: project.name,
          projectContext,
          chatSummaries,
          agentNotesContext,
          existingOverviewContext,
          userName,
          generatedAt,
          taskCount,
          acceptedTasks,
        }),
      ),
      taskCount,
      project.name,
    );
    const now = generatedAt.toISOString();
    const mergedTasks = mergeGeneratedAgentTasks(
      existingTasks,
      normalizeAgentTasksProjectName(draft.tasks, project.name),
    );
    const stored = await upsertAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      { tasks: mergedTasks },
      now,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
        project.name,
      ),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI task generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json({ error: "Failed to generate tasks" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsedTeammate = parseTeammateId(rawTeammateId);

    if ("error" in parsedTeammate) {
      return parsedTeammate.error;
    }

    const parsedProject = parseProjectId(new URL(request.url).searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectName = await getProjectNameForUser(
      db,
      auth.userId,
      parsedProject.projectId,
    );
    const stored = await clearAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
        projectName,
      ),
    );
  } catch {
    return Response.json({ error: "Failed to clear tasks" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsedTeammate = parseTeammateId(rawTeammateId);

    if ("error" in parsedTeammate) {
      return parsedTeammate.error;
    }

    const parsedProject = parseProjectId(new URL(request.url).searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const body = (await request.json()) as {
      taskTitle?: unknown;
      status?: unknown;
    };
    const taskTitle =
      typeof body.taskTitle === "string" ? body.taskTitle.trim() : "";

    if (!taskTitle) {
      return Response.json({ error: "taskTitle is required" }, { status: 400 });
    }

    const status = parseAgentTaskStatus(body.status);

    if (!status || status === "pending") {
      return Response.json(
        { error: "status must be accepted or rejected" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const existingRecord = await getAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    if (!existingRecord) {
      return Response.json({ error: "Tasks not found" }, { status: 404 });
    }

    if (
      status === "accepted" &&
      !canAcceptAgentTask(existingRecord.tasks, taskTitle)
    ) {
      return Response.json(
        {
          error: `You can only accept up to ${AGENT_TASK_COUNT} tasks at a time.`,
        },
        { status: 409 },
      );
    }

    const stored = await updateAgentTaskStatus(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      taskTitle,
      status,
    );

    if (!stored) {
      return Response.json({ error: "Tasks not found" }, { status: 404 });
    }

    const projectName = await getProjectNameForUser(
      db,
      auth.userId,
      parsedProject.projectId,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
        projectName,
      ),
    );
  } catch {
    return Response.json(
      { error: "Failed to update task status" },
      { status: 500 },
    );
  }
}
