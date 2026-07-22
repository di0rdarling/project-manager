import { ObjectId } from "mongodb";
import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { getAgentNotes } from "@/lib/agents/agent-notes-store";
import { parseAgentTasksJson } from "@/lib/agents/agent-tasks-json";
import {
  clearAgentTasks,
  getAgentTasks,
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
import { buildAgentNotesContext } from "@/lib/prompts/agent-notes-context-prompt";
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
): AgentTasksResponse {
  return {
    teammateId,
    projectId,
    tasks: record?.tasks ?? [],
    updatedAt: record ? toIsoString(record.updatedAt) : null,
  };
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
    const record = await getAgentTasks(
      client.db(),
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        record,
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
    const [agentNotes, existingUserMemory, currentUser] = await Promise.all([
      getAgentNotes(db, auth.userId, parsedTeammate.teammateId),
      getUserMemory(db, auth.userId, parsedTeammate.teammateId),
      findUserById(db, auth.userId),
    ]);
    const agentNotesContext = buildAgentNotesContext(agentNotes) ?? undefined;
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
        }),
      ),
    );
    const now = generatedAt.toISOString();
    const stored = await upsertAgentTasks(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      draft,
      now,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
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
    const stored = await clearAgentTasks(
      client.db(),
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
    );

    return Response.json(
      serializeAgentTasks(
        parsedTeammate.teammateId,
        parsedProject.projectIdString,
        stored,
      ),
    );
  } catch {
    return Response.json({ error: "Failed to clear tasks" }, { status: 500 });
  }
}
