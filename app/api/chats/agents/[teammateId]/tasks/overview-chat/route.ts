import { ObjectId } from "mongodb";
import { refreshAgentMemoryFromChatSummary } from "@/lib/agents/agent-memory-refresh";
import { refreshUserMemoryFromChatSummary } from "@/lib/agents/user-memory-refresh";
import {
  getTaskOverviewMessages,
  insertTaskOverviewMessages,
} from "@/lib/agents/agent-task-overview-store";
import {
  getOrCreateTaskOverviewSession,
  parseTaskOverviewModelId,
  parseTaskOverviewReasoningEffort,
  updateTaskOverviewSessionSettings,
  updateTaskOverviewSessionSummary,
} from "@/lib/agents/agent-task-overview-session-store";
import { findAgentTaskByTitle } from "@/lib/agents/agent-tasks-store";
import {
  parseProjectId,
  parseTeammateId,
} from "@/lib/agents/agent-tasks-route-helpers";
import {
  CHAT_CONTEXT_TOKEN_LIMIT,
  getAgentTaskOverviewContextUsage,
} from "@/lib/chats/chat-context/get-agent-task-overview-context-usage";
import { loadAgentTaskOverviewGenerationContext } from "@/lib/chats/chat-context/agent-task-overview-generation-context";
import {
  streamAgentTaskOverviewChatReply,
  type GenerateAgentTaskOverviewChatReplyResult,
} from "@/lib/agent-task-overview-chat-generation";
import { getChatProviderConfigError } from "@/lib/chat-generation";
import {
  createChatStreamResponse,
  type ChatStreamEvent,
} from "@/lib/chats/chat-stream-protocol";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/chats/chat-models";
import { chatModelSupportsReasoningEffort } from "@/lib/chats/kimi-reasoning-effort";
import { generateConversationSummary } from "@/lib/gemini";
import { KimiApiError } from "@/lib/kimi";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import {
  buildChatConversationSummaryPrompt,
  RECENT_MESSAGE_WINDOW,
} from "@/lib/prompts/chat-conversation-summary-prompt";
import { findUserById, getUserAgentTaskGenerationModelId } from "@/lib/users";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type {
  AgentTask,
  AgentTaskOverviewChatResponse,
  SendAgentTaskOverviewMessageResponse,
  UpdateAgentTaskOverviewChatResponse,
} from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

function parseTaskTitle(searchParams: URLSearchParams) {
  const taskTitle = searchParams.get("taskTitle")?.trim();

  if (!taskTitle) {
    return {
      error: Response.json(
        { error: "taskTitle query parameter is required" },
        { status: 400 },
      ),
    };
  }

  return { taskTitle };
}

async function loadTaskForOverviewChat(
  db: Awaited<ReturnType<Awaited<ReturnType<typeof getClientPromise>>["db"]>>,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  taskTitle: string,
) {
  const task = await findAgentTaskByTitle(
    db,
    userId,
    teammateId,
    projectId,
    taskTitle,
  );

  if (!task) {
    return {
      error: Response.json({ error: "Task not found" }, { status: 404 }),
    };
  }

  return { task };
}

async function buildOverviewChatResponse(
  db: Awaited<ReturnType<Awaited<ReturnType<typeof getClientPromise>>["db"]>>,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  task: AgentTask,
  taskTitle: string,
  userName: string | null,
  defaultModelId: typeof DEFAULT_CHAT_MODEL_ID,
  pendingMessage?: string,
): Promise<AgentTaskOverviewChatResponse> {
  const messages = await getTaskOverviewMessages(
    db,
    userId,
    teammateId,
    projectId,
    taskTitle,
  );

  const session = await getOrCreateTaskOverviewSession(
    db,
    { userId, teammateId, projectId, taskTitle },
    defaultModelId,
  );

  const contextUsage = await getAgentTaskOverviewContextUsage({
    db,
    userId,
    teammateId,
    projectId,
    task,
    messages,
    userName,
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort,
    conversationSummary: session.conversationSummary,
    pendingMessage,
  });

  return {
    messages,
    task,
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort,
    conversationSummary: session.conversationSummary,
    contextUsage,
  };
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

    const searchParams = new URL(request.url).searchParams;
    const parsedProject = parseProjectId(searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const parsedTaskTitle = parseTaskTitle(searchParams);

    if ("error" in parsedTaskTitle) {
      return parsedTaskTitle.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const loaded = await loadTaskForOverviewChat(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      parsedTaskTitle.taskTitle,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const defaultModelId = getUserAgentTaskGenerationModelId(currentUser);

    const response = await buildOverviewChatResponse(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      loaded.task,
      parsedTaskTitle.taskTitle,
      userName,
      defaultModelId,
    );

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to fetch task overview chat" },
      { status: 500 },
    );
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

    const searchParams = new URL(request.url).searchParams;
    const parsedProject = parseProjectId(searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const parsedTaskTitle = parseTaskTitle(searchParams);

    if ("error" in parsedTaskTitle) {
      return parsedTaskTitle.error;
    }

    const body = await request.json();
    const modelId = parseTaskOverviewModelId(body.modelId);
    const reasoningEffort = parseTaskOverviewReasoningEffort(
      body.reasoningEffort,
    );

    if (body.modelId !== undefined && !modelId) {
      return Response.json({ error: "Invalid model id" }, { status: 400 });
    }

    if (
      body.reasoningEffort !== undefined &&
      body.reasoningEffort !== null &&
      !reasoningEffort
    ) {
      return Response.json(
        { error: "Invalid reasoning effort" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const loaded = await loadTaskForOverviewChat(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      parsedTaskTitle.taskTitle,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const defaultModelId = getUserAgentTaskGenerationModelId(currentUser);

    const session = await updateTaskOverviewSessionSettings(
      db,
      {
        userId: auth.userId,
        teammateId: parsedTeammate.teammateId,
        projectId: parsedProject.projectId,
        taskTitle: parsedTaskTitle.taskTitle,
      },
      {
        ...(modelId ? { modelId } : {}),
        ...(body.reasoningEffort !== undefined
          ? {
              reasoningEffort:
                modelId && !chatModelSupportsReasoningEffort(modelId)
                  ? null
                  : reasoningEffort,
            }
          : {}),
      },
      defaultModelId,
    );

    const messages = await getTaskOverviewMessages(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      parsedTaskTitle.taskTitle,
    );

    const contextUsage = await getAgentTaskOverviewContextUsage({
      db,
      userId: auth.userId,
      teammateId: parsedTeammate.teammateId,
      projectId: parsedProject.projectId,
      task: loaded.task,
      messages,
      userName,
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      conversationSummary: session.conversationSummary,
    });

    const response: UpdateAgentTaskOverviewChatResponse = {
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      contextUsage,
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to update task overview chat settings" },
      { status: 500 },
    );
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

    const searchParams = new URL(request.url).searchParams;
    const parsedProject = parseProjectId(searchParams);

    if ("error" in parsedProject) {
      return parsedProject.error;
    }

    const parsedTaskTitle = parseTaskTitle(searchParams);

    if ("error" in parsedTaskTitle) {
      return parsedTaskTitle.error;
    }

    const body = await request.json();
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return Response.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const loaded = await loadTaskForOverviewChat(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      parsedTaskTitle.taskTitle,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const defaultModelId = getUserAgentTaskGenerationModelId(currentUser);
    const sessionKey = {
      userId: auth.userId,
      teammateId: parsedTeammate.teammateId,
      projectId: parsedProject.projectId,
      taskTitle: parsedTaskTitle.taskTitle,
    };

    const session = await getOrCreateTaskOverviewSession(
      db,
      sessionKey,
      defaultModelId,
    );

    const existingMessages = await getTaskOverviewMessages(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      parsedTaskTitle.taskTitle,
    );

    const contextUsage = await getAgentTaskOverviewContextUsage({
      db,
      userId: auth.userId,
      teammateId: parsedTeammate.teammateId,
      projectId: parsedProject.projectId,
      task: loaded.task,
      messages: existingMessages,
      userName,
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      conversationSummary: session.conversationSummary,
      pendingMessage: content,
    });

    if (contextUsage.isAtLimit) {
      return Response.json(
        {
          error: `This conversation has reached the ${CHAT_CONTEXT_TOKEN_LIMIT.toLocaleString()}-token context limit.`,
        },
        { status: 400 },
      );
    }

    const generationContext = await loadAgentTaskOverviewGenerationContext(
      db,
      auth.userId,
      parsedTeammate.teammateId,
      parsedProject.projectId,
      loaded.task,
      existingMessages,
      userName,
      session.modelId,
      session.reasoningEffort,
      session.conversationSummary,
    );

    const providerConfigError = getChatProviderConfigError(
      generationContext.modelId,
    );

    if (providerConfigError) {
      return Response.json(
        {
          error:
            providerConfigError === "KIMI_API_KEY is not configured"
              ? "Kimi chat is not configured. Add KIMI_API_KEY to your environment."
              : "AI chat is not configured",
        },
        { status: 503 },
      );
    }

    const generatedAt = new Date();

    return createChatStreamResponse(async (send) => {
      let assistantReply: GenerateAgentTaskOverviewChatReplyResult | undefined;

      for await (const event of streamAgentTaskOverviewChatReply(
        {
          history: generationContext.history,
          message: content,
          teammateId: generationContext.teammateId,
          projectContext: generationContext.projectContext,
          otherConversationsContext: generationContext.otherConversationsContext,
          otherTeammatesContext: generationContext.otherTeammatesContext,
          agentNotesContext: generationContext.agentNotesContext,
          userName,
          modelId: generationContext.modelId,
          reasoningEffort: generationContext.reasoningEffort,
          generatedAt,
          taskOverviewContext: generationContext.taskOverviewContext,
          agentTasksDocumentsContext:
            generationContext.agentTasksDocumentsContext,
        },
        {
          db,
          userId: auth.userId,
          teammateId: parsedTeammate.teammateId,
          projectId: parsedProject.projectId,
          taskTitle: parsedTaskTitle.taskTitle,
        },
      )) {
        if (event.type === "token") {
          send({ type: "token", delta: event.delta });
          continue;
        }

        assistantReply = event.result;
      }

      if (!assistantReply) {
        throw new Error("Agent task overview chat returned an empty response");
      }

      const updatedTask =
        assistantReply.updatedTask ??
        (await findAgentTaskByTitle(
          db,
          auth.userId,
          parsedTeammate.teammateId,
          parsedProject.projectId,
          parsedTaskTitle.taskTitle,
        ));

      const currentTaskTitle = updatedTask?.title ?? parsedTaskTitle.taskTitle;
      const previousTaskTitle =
        currentTaskTitle !== parsedTaskTitle.taskTitle
          ? parsedTaskTitle.taskTitle
          : undefined;

      const now = generatedAt.toISOString();
      const { userMessage, assistantMessage } = await insertTaskOverviewMessages(
        db,
        {
          userId: auth.userId,
          teammateId: parsedTeammate.teammateId,
          projectId: parsedProject.projectId,
          taskTitle: currentTaskTitle,
          userContent: content,
          assistantContent: assistantReply.content,
          createdAt: now,
        },
      );

      const fullTranscript = [
        ...generationContext.history,
        { role: "user" as const, content },
        { role: "model" as const, content: assistantReply.content },
      ];

      const overviewChatTitle = `Task: ${currentTaskTitle}`;
      let conversationSummary = session.conversationSummary;

      try {
        const recentMessages = fullTranscript.slice(-RECENT_MESSAGE_WINDOW);
        const hasTruncatedMessages =
          fullTranscript.length > recentMessages.length;

        conversationSummary = await generateConversationSummary(
          buildChatConversationSummaryPrompt({
            teammateId: parsedTeammate.teammateId,
            chatTitle: overviewChatTitle,
            conversationKind: "task_overview",
            olderSummary: hasTruncatedMessages ? session.conversationSummary : null,
            recentMessages,
            userName,
            generatedAt,
          }),
        );

        await updateTaskOverviewSessionSummary(
          db,
          {
            userId: auth.userId,
            teammateId: parsedTeammate.teammateId,
            projectId: parsedProject.projectId,
            taskTitle: currentTaskTitle,
          },
          conversationSummary,
          now,
        );
      } catch {
        // Keep the previous summary if generation fails.
      }

      if (conversationSummary?.trim()) {
        try {
          await refreshAgentMemoryFromChatSummary({
            db,
            userId: auth.userId,
            teammateId: parsedTeammate.teammateId,
            chatTitle: overviewChatTitle,
            conversationSummary,
            projectId: parsedProject.projectId,
            userName,
            updatedAt: now,
          });
        } catch {
          // Memory refresh is best-effort.
        }

        try {
          await refreshUserMemoryFromChatSummary({
            db,
            userId: auth.userId,
            teammateId: parsedTeammate.teammateId,
            chatTitle: overviewChatTitle,
            conversationSummary,
            projectId: parsedProject.projectId,
            userName,
            updatedAt: now,
          });
        } catch {
          // Memory refresh is best-effort.
        }
      }

      const updatedMessages = await getTaskOverviewMessages(
        db,
        auth.userId,
        parsedTeammate.teammateId,
        parsedProject.projectId,
        currentTaskTitle,
      );

      const updatedContextUsage = await getAgentTaskOverviewContextUsage({
        db,
        userId: auth.userId,
        teammateId: parsedTeammate.teammateId,
        projectId: parsedProject.projectId,
        task: updatedTask ?? loaded.task,
        messages: updatedMessages,
        userName,
        modelId: session.modelId,
        reasoningEffort: session.reasoningEffort,
        conversationSummary,
      });

      const response: SendAgentTaskOverviewMessageResponse = {
        userMessage,
        assistantMessage,
        task: updatedTask ?? loaded.task,
        ...(previousTaskTitle ? { previousTaskTitle } : {}),
        modelId: session.modelId,
        reasoningEffort: session.reasoningEffort,
        conversationSummary,
        contextUsage: updatedContextUsage,
      };

      send({ type: "done", data: response } satisfies ChatStreamEvent);
    });
  } catch (error) {
    if (error instanceof KimiApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      if (error.message === "GEMINI_API_KEY is not configured") {
        return Response.json(
          { error: "AI chat is not configured" },
          { status: 503 },
        );
      }

      if (error.message === "KIMI_API_KEY is not configured") {
        return Response.json(
          {
            error:
              "Kimi chat is not configured. Add KIMI_API_KEY to your environment.",
          },
          { status: 503 },
        );
      }
    }

    return Response.json(
      { error: "Failed to send task overview message" },
      { status: 500 },
    );
  }
}
