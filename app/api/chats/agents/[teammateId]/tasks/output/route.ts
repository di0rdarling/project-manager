import { getChatTeammate } from "@/lib/chats/chat-teammates";
import { canAccessAgentTaskOutputTabs } from "@/lib/agents/agent-tasks";
import { parseAgentTaskOutputJson } from "@/lib/agents/agent-task-output-json";
import {
  getAgentTasks,
  updateAgentTaskOutput,
} from "@/lib/agents/agent-tasks-store";
import {
  getProjectNameForUser,
  parseProjectId,
  parseTeammateId,
  serializeAgentTasks,
} from "@/lib/agents/agent-tasks-route-helpers";
import { requireUserId } from "@/lib/current-user";
import { generateAgentTaskOutput } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { getProjectContext } from "@/lib/project-context";
import { buildAgentTaskOutputPrompt } from "@/lib/prompts/agent-task-output-prompt";
import { findUserById } from "@/lib/users";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

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

    const body = (await request.json()) as { taskTitle?: unknown };
    const taskTitle =
      typeof body.taskTitle === "string" ? body.taskTitle.trim() : "";

    if (!taskTitle) {
      return Response.json({ error: "taskTitle is required" }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db();
    const existingRecord = await getAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );
    const task = existingRecord?.tasks.find((item) => item.title === taskTitle);

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (!canAccessAgentTaskOutputTabs(task)) {
      return Response.json(
        { error: "Only accepted tasks can be started" },
        { status: 409 },
      );
    }

    const project = await db.collection("projects").findOne({
      _id: parsedProject.projectId,
      userId: auth.userId,
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const projectContext = await getProjectContext(
      db,
      auth.userId,
      parsedProject.projectId,
    );

    if (!projectContext) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const teammate = getChatTeammate(parsedTeammate.teammateId);

    const draft = parseAgentTaskOutputJson(
      await generateAgentTaskOutput(
        buildAgentTaskOutputPrompt({
          teammateId: parsedTeammate.teammateId,
          agentName: teammate.name,
          agentRole: teammate.role,
          projectName: project.name,
          projectContext,
          task,
          userName,
        }),
      ),
    );

    const stored = await updateAgentTaskOutput(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      taskTitle,
      draft,
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
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
        projectName,
      ),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI task output generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate task output" },
      { status: 500 },
    );
  }
}
