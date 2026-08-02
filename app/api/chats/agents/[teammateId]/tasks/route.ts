import { getChatTeammate } from "@/lib/chats/chat-teammates";
import { loadAgentTaskPromptContext } from "@/lib/agents/load-agent-task-prompt-context";
import { parseAgentTasksJson } from "@/lib/agents/agent-tasks-json";
import {
  canAcceptAgentTask,
  canGenerateAgentTasks,
  canReplaceAgentTask,
  getAcceptedAgentTasks,
  getAgentTaskGenerationSlots,
  mergeGeneratedAgentTasks,
  normalizeAgentTasksProjectName,
  parseAgentTaskStatus,
  replaceGeneratedAgentTask,
} from "@/lib/agents/agent-tasks";
import { AGENT_TASK_COUNT } from "@/lib/agents/agent-tasks-json";
import {
  clearAgentTasks,
  getAgentTasks,
  updateAgentTaskStatus,
  upsertAgentTasks,
} from "@/lib/agents/agent-tasks-store";
import { rejectAndDeleteAgentTaskByTitle } from "@/lib/agents/reject-agent-task";
import {
  getProjectNameForUser,
  parseProjectId,
  parseTeammateId,
  serializeAgentTasksResponse,
} from "@/lib/agents/agent-tasks-route-helpers";
import { requireUserId } from "@/lib/current-user";
import { generateAgentTasks } from "@/lib/agent-task-generation";
import { getChatProviderConfigError } from "@/lib/chat-generation";
import getClientPromise from "@/lib/mongodb";
import { getProjectContext } from "@/lib/project-context";
import { buildAgentTasksPrompt } from "@/lib/prompts/agent-tasks-prompt";
import { findUserById, getUserAgentTaskGenerationModelId } from "@/lib/users";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

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
      await serializeAgentTasksResponse(
        db,
        auth.userId,
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

    let replaceTaskTitle = "";
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = (await request.json()) as { replaceTaskTitle?: unknown };
      replaceTaskTitle =
        typeof body.replaceTaskTitle === "string"
          ? body.replaceTaskTitle.trim()
          : "";
    }

    if (replaceTaskTitle) {
      const taskToReplace = existingTasks.find(
        (task) => task.title === replaceTaskTitle,
      );

      if (!taskToReplace) {
        return Response.json({ error: "Task not found" }, { status: 404 });
      }

      if (!canReplaceAgentTask(existingTasks, replaceTaskTitle)) {
        return Response.json(
          {
            error:
              "Accepted tasks cannot be replaced. Generate an alternative for a pending task instead.",
          },
          { status: 409 },
        );
      }
    } else if (!canGenerateAgentTasks(existingTasks)) {
      return Response.json(
        {
          error:
            "All task slots are filled with accepted tasks. Clear tasks or wait for accepted work to complete before generating more.",
        },
        { status: 409 },
      );
    }

    const acceptedTasks = getAcceptedAgentTasks(existingTasks);
    const taskCount = replaceTaskTitle
      ? 1
      : getAgentTaskGenerationSlots(existingTasks);
    const taskToReplace = replaceTaskTitle
      ? existingTasks.find((task) => task.title === replaceTaskTitle)
      : undefined;
    const otherTasks = replaceTaskTitle
      ? existingTasks
          .filter((task) => task.title !== replaceTaskTitle)
          .map((task) => ({ title: task.title, detail: task.detail }))
      : [];

    const {
      chatSummaries,
      agentNotesContext,
      existingOverviewContext,
      agentTasksDocumentsContext,
    } = await loadAgentTaskPromptContext(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const agentTaskGenerationModelId =
      getUserAgentTaskGenerationModelId(currentUser);
    const providerConfigError = getChatProviderConfigError(
      agentTaskGenerationModelId,
    );

    if (providerConfigError) {
      return Response.json(
        { error: "AI task generation is not configured" },
        { status: 503 },
      );
    }

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
          agentTasksDocumentsContext,
          userName,
          generatedAt,
          taskCount,
          acceptedTasks,
          replaceTask: taskToReplace
            ? { title: taskToReplace.title, detail: taskToReplace.detail }
            : undefined,
          otherTasks,
        }),
        agentTaskGenerationModelId,
      ),
      taskCount,
      project.name,
    );
    const now = generatedAt.toISOString();
    const normalizedGeneratedTasks = normalizeAgentTasksProjectName(
      draft.tasks,
      project.name,
    );
    const mergedTasks = replaceTaskTitle
      ? replaceGeneratedAgentTask(
          existingTasks,
          replaceTaskTitle,
          normalizedGeneratedTasks[0],
        )
      : mergeGeneratedAgentTasks(existingTasks, normalizedGeneratedTasks);
    const stored = await upsertAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      { tasks: mergedTasks },
      now,
    );

    return Response.json(
      await serializeAgentTasksResponse(
        db,
        auth.userId,
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
        project.name,
      ),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "GEMINI_API_KEY is not configured" ||
        error.message === "KIMI_API_KEY is not configured")
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
      await serializeAgentTasksResponse(
        db,
        auth.userId,
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

    const rejectResult =
      status === "rejected"
        ? await rejectAndDeleteAgentTaskByTitle(
            db,
            auth.userId,
            parsedTeammate.teammateId,
            parsedProject.projectId,
            taskTitle,
          )
        : null;
    const stored =
      status === "rejected"
        ? rejectResult?.removedTask
          ? rejectResult.record
          : null
        : await updateAgentTaskStatus(
            db,
            auth.userId,
            parsedTeammate.teammateId,
            parsedProject.projectId,
            taskTitle,
            status,
          );

    if (!stored) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const projectName = await getProjectNameForUser(
      db,
      auth.userId,
      parsedProject.projectId,
    );

    return Response.json(
      await serializeAgentTasksResponse(
        db,
        auth.userId,
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
