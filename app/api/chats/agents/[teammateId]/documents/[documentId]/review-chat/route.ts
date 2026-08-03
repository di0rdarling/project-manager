import { ObjectId } from "mongodb";
import { refreshAgentMemoryFromChatSummary } from "@/lib/agents/agent-memory-refresh";
import { refreshUserMemoryFromChatSummary } from "@/lib/agents/user-memory-refresh";
import {
  getDocumentReviewMessages,
  insertDocumentReviewMessages,
} from "@/lib/agents/agent-document-review-store";
import {
  getOrCreateDocumentReviewSession,
  parseDocumentReviewModelId,
  parseDocumentReviewReasoningEffort,
  updateDocumentReviewSessionSettings,
  updateDocumentReviewSessionSummary,
} from "@/lib/agents/agent-document-review-session-store";
import {
  getUnifiedTaskConversationMessages,
  resolveUnifiedTaskConversationSession,
  type TaskConversationKey,
} from "@/lib/agents/agent-task-conversation";
import { insertTaskOverviewMessages } from "@/lib/agents/agent-task-overview-store";
import {
  parseTaskOverviewModelId,
  parseTaskOverviewReasoningEffort,
  updateTaskOverviewSessionSettings,
  updateTaskOverviewSessionSummary,
} from "@/lib/agents/agent-task-overview-session-store";
import {
  getAgentDocumentById,
  updateAgentDocumentStatus,
} from "@/lib/agents/agent-documents-store";
import { isAgentDocumentInReviewStage } from "@/lib/agents/agent-documents";
import { findAgentTaskByDocumentId } from "@/lib/agents/agent-tasks-store";
import {
  CHAT_CONTEXT_TOKEN_LIMIT,
  getDocumentReviewContextUsage,
} from "@/lib/chats/chat-context/get-document-review-context-usage";
import { loadDocumentReviewGenerationContext } from "@/lib/chats/chat-context/document-review-generation-context";
import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  getChatProviderConfigError,
  streamChatReply,
  type GenerateChatReplyResult,
} from "@/lib/chat-generation";
import {
  createChatStreamResponse,
  type ChatStreamEvent,
} from "@/lib/chats/chat-stream-protocol";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/chats/chat-models";
import {
  chatModelSupportsReasoningEffort,
} from "@/lib/chats/kimi-reasoning-effort";
import { generateConversationSummary } from "@/lib/gemini";
import { KimiApiError } from "@/lib/kimi";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import {
  buildChatConversationSummaryPrompt,
  RECENT_MESSAGE_WINDOW,
} from "@/lib/prompts/chat-conversation-summary-prompt";
import { findUserById } from "@/lib/users";
import type { ChatTeammateId } from "@/lib/chats/chat-teammates";
import type {
  AgentDocumentResponse,
  AgentDocumentReviewChatResponse,
  AgentTask,
  SendDocumentReviewMessageResponse,
  UpdateDocumentReviewChatResponse,
} from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string; documentId: string }>;
};

function parseRouteParams(teammateId: string, documentId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  if (!ObjectId.isValid(documentId)) {
    return {
      error: Response.json({ error: "Invalid document id" }, { status: 400 }),
    };
  }

  return { teammateId, documentId: new ObjectId(documentId) };
}

function getTaskConversationMeta(
  task: AgentTask | null,
  projectId: ObjectId | null,
): { projectId: string; taskTitle: string } | null {
  if (!task || !projectId) {
    return null;
  }

  return {
    projectId: projectId.toString(),
    taskTitle: task.title,
  };
}

function getTaskConversationKey(
  userId: ObjectId,
  teammateId: ChatTeammateId,
  projectId: ObjectId,
  task: AgentTask,
): TaskConversationKey {
  return {
    userId,
    teammateId,
    projectId,
    taskTitle: task.title,
  };
}

async function loadDocumentForReview(
  db: Awaited<ReturnType<Awaited<ReturnType<typeof getClientPromise>>["db"]>>,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
) {
  const document = await getAgentDocumentById(db, userId, teammateId, documentId);

  if (!document) {
    return {
      error: Response.json({ error: "Document not found" }, { status: 404 }),
    };
  }

  if (!isAgentDocumentInReviewStage(document.status)) {
    return {
      error: Response.json(
        { error: "Review chat is only available while a document is under review." },
        { status: 400 },
      ),
    };
  }

  const taskMatch = await findAgentTaskByDocumentId(
    db,
    userId,
    teammateId,
    documentId.toString(),
  );

  return {
    document,
    task: taskMatch?.task ?? null,
    projectId: taskMatch?.projectId ?? null,
  };
}

function getDefaultReviewModelId(task: AgentTask | null) {
  return task?.outputModelId ?? DEFAULT_CHAT_MODEL_ID;
}

async function buildReviewChatResponse(
  db: Awaited<ReturnType<Awaited<ReturnType<typeof getClientPromise>>["db"]>>,
  userId: ObjectId,
  teammateId: ChatTeammateId,
  documentId: ObjectId,
  document: AgentDocumentResponse,
  task: AgentTask | null,
  projectId: ObjectId | null,
  userName: string | null,
  pendingMessage?: string,
): Promise<AgentDocumentReviewChatResponse> {
  const defaultModelId = getDefaultReviewModelId(task);
  const usesUnifiedConversation = Boolean(task && projectId);
  const taskConversation = getTaskConversationMeta(task, projectId);

  const messages = usesUnifiedConversation
    ? await getUnifiedTaskConversationMessages(
        db,
        getTaskConversationKey(userId, teammateId, projectId!, task!),
        documentId,
      )
    : await getDocumentReviewMessages(db, userId, teammateId, documentId);

  const session = usesUnifiedConversation
    ? await resolveUnifiedTaskConversationSession(
        db,
        getTaskConversationKey(userId, teammateId, projectId!, task!),
        documentId,
        defaultModelId,
      )
    : await getOrCreateDocumentReviewSession(
        db,
        userId,
        teammateId,
        documentId,
        defaultModelId,
      );

  const contextUsage = await getDocumentReviewContextUsage({
    db,
    userId,
    teammateId,
    document,
    task,
    messages,
    userName,
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort,
    conversationSummary: session.conversationSummary,
    pendingMessage,
    continuesTaskConversation: usesUnifiedConversation,
  });

  return {
    messages,
    document,
    task,
    taskConversation,
    modelId: session.modelId,
    reasoningEffort: session.reasoningEffort,
    conversationSummary: session.conversationSummary,
    contextUsage,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const db = client.db();
    const loaded = await loadDocumentForReview(
      db,
      auth.userId,
      parsed.teammateId,
      parsed.documentId,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;

    const response = await buildReviewChatResponse(
      db,
      auth.userId,
      parsed.teammateId,
      parsed.documentId,
      loaded.document,
      loaded.task,
      loaded.projectId,
      userName,
    );

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to fetch document review chat" },
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

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const body = await request.json();
    const modelId = parseDocumentReviewModelId(body.modelId);
    const reasoningEffort = parseDocumentReviewReasoningEffort(
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
    const loaded = await loadDocumentForReview(
      db,
      auth.userId,
      parsed.teammateId,
      parsed.documentId,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const defaultModelId = getDefaultReviewModelId(loaded.task);
    const usesUnifiedConversation = Boolean(loaded.task && loaded.projectId);

    const session = usesUnifiedConversation
      ? await updateTaskOverviewSessionSettings(
          db,
          getTaskConversationKey(
            auth.userId,
            parsed.teammateId,
            loaded.projectId!,
            loaded.task!,
          ),
          {
            ...(parseTaskOverviewModelId(body.modelId)
              ? { modelId: parseTaskOverviewModelId(body.modelId)! }
              : {}),
            ...(body.reasoningEffort !== undefined
              ? {
                  reasoningEffort:
                    parseTaskOverviewModelId(body.modelId) &&
                    !chatModelSupportsReasoningEffort(
                      parseTaskOverviewModelId(body.modelId)!,
                    )
                      ? null
                      : parseTaskOverviewReasoningEffort(body.reasoningEffort),
                }
              : {}),
          },
          defaultModelId,
        )
      : await updateDocumentReviewSessionSettings(
          db,
          auth.userId,
          parsed.teammateId,
          parsed.documentId,
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

    const messages = usesUnifiedConversation
      ? await getUnifiedTaskConversationMessages(
          db,
          getTaskConversationKey(
            auth.userId,
            parsed.teammateId,
            loaded.projectId!,
            loaded.task!,
          ),
          parsed.documentId,
        )
      : await getDocumentReviewMessages(
          db,
          auth.userId,
          parsed.teammateId,
          parsed.documentId,
        );

    const contextUsage = await getDocumentReviewContextUsage({
      db,
      userId: auth.userId,
      teammateId: parsed.teammateId,
      document: loaded.document,
      task: loaded.task,
      messages,
      userName,
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      conversationSummary: session.conversationSummary,
      continuesTaskConversation: usesUnifiedConversation,
    });

    const response: UpdateDocumentReviewChatResponse = {
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      contextUsage,
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Failed to update review chat settings" },
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

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
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
    const loaded = await loadDocumentForReview(
      db,
      auth.userId,
      parsed.teammateId,
      parsed.documentId,
    );

    if ("error" in loaded) {
      return loaded.error;
    }

    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const defaultModelId = getDefaultReviewModelId(loaded.task);
    const usesUnifiedConversation = Boolean(loaded.task && loaded.projectId);
    const taskConversationKey =
      usesUnifiedConversation && loaded.task && loaded.projectId
        ? getTaskConversationKey(
            auth.userId,
            parsed.teammateId,
            loaded.projectId,
            loaded.task,
          )
        : null;

    const session = usesUnifiedConversation
      ? await resolveUnifiedTaskConversationSession(
          db,
          taskConversationKey!,
          parsed.documentId,
          defaultModelId,
        )
      : await getOrCreateDocumentReviewSession(
          db,
          auth.userId,
          parsed.teammateId,
          parsed.documentId,
          defaultModelId,
        );

    const existingMessages = usesUnifiedConversation
      ? await getUnifiedTaskConversationMessages(
          db,
          taskConversationKey!,
          parsed.documentId,
        )
      : await getDocumentReviewMessages(
          db,
          auth.userId,
          parsed.teammateId,
          parsed.documentId,
        );

    const contextUsage = await getDocumentReviewContextUsage({
      db,
      userId: auth.userId,
      teammateId: parsed.teammateId,
      document: loaded.document,
      task: loaded.task,
      messages: existingMessages,
      userName,
      modelId: session.modelId,
      reasoningEffort: session.reasoningEffort,
      conversationSummary: session.conversationSummary,
      pendingMessage: content,
      continuesTaskConversation: usesUnifiedConversation,
    });

    if (contextUsage.isAtLimit) {
      return Response.json(
        {
          error: `This conversation has reached the ${CHAT_CONTEXT_TOKEN_LIMIT.toLocaleString()}-token context limit.`,
        },
        { status: 400 },
      );
    }

    const generationContext = await loadDocumentReviewGenerationContext(
      db,
      auth.userId,
      parsed.teammateId,
      loaded.document,
      loaded.task,
      existingMessages,
      userName,
      session.modelId,
      session.reasoningEffort,
      session.conversationSummary,
      usesUnifiedConversation,
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
      let assistantReply: GenerateChatReplyResult | undefined;

      for await (const event of streamChatReply(
        generationContext.history,
        content,
        generationContext.teammateId,
        generationContext.projectContext,
        generationContext.otherConversationsContext,
        generationContext.otherTeammatesContext,
        generationContext.agentNotesContext,
        userName,
        generationContext.modelId,
        generationContext.reasoningEffort,
        generatedAt,
        generationContext.documentReviewContext,
        generationContext.agentTasksDocumentsContext,
      )) {
        if (event.type === "token") {
          send({ type: "token", delta: event.delta });
          continue;
        }

        assistantReply = event.result;
      }

      if (!assistantReply) {
        throw new Error("Chat returned an empty response");
      }

      const now = generatedAt.toISOString();
      const { userMessage, assistantMessage } = usesUnifiedConversation
        ? await insertTaskOverviewMessages(db, {
            userId: auth.userId,
            teammateId: parsed.teammateId,
            projectId: loaded.projectId!,
            taskTitle: loaded.task!.title,
            userContent: content,
            assistantContent: assistantReply.content,
            createdAt: now,
          })
        : await insertDocumentReviewMessages(db, {
            userId: auth.userId,
            teammateId: parsed.teammateId,
            documentId: parsed.documentId,
            userContent: content,
            assistantContent: assistantReply.content,
            createdAt: now,
          });

      const fullTranscript = [
        ...generationContext.history,
        { role: "user" as const, content },
        { role: "model" as const, content: assistantReply.content },
      ];

      const reviewChatTitle = usesUnifiedConversation
        ? `Task: ${loaded.task!.title}`
        : `Review: ${generationContext.documentTitle}`;
      let conversationSummary = session.conversationSummary;

      try {
        const recentMessages = fullTranscript.slice(-RECENT_MESSAGE_WINDOW);
        const hasTruncatedMessages =
          fullTranscript.length > recentMessages.length;

        conversationSummary = await generateConversationSummary(
          buildChatConversationSummaryPrompt({
            teammateId: parsed.teammateId,
            chatTitle: reviewChatTitle,
            conversationKind: usesUnifiedConversation
              ? "task_overview"
              : "document_review",
            olderSummary: hasTruncatedMessages ? session.conversationSummary : null,
            recentMessages,
            userName,
            generatedAt,
          }),
        );

        if (usesUnifiedConversation && taskConversationKey) {
          await updateTaskOverviewSessionSummary(
            db,
            taskConversationKey,
            conversationSummary,
            now,
          );
        } else {
          await updateDocumentReviewSessionSummary(
            db,
            auth.userId,
            parsed.teammateId,
            parsed.documentId,
            conversationSummary,
            now,
          );
        }
      } catch {
        // Keep the previous summary if generation fails.
      }

      if (conversationSummary?.trim()) {
        try {
          await refreshAgentMemoryFromChatSummary({
            db,
            userId: auth.userId,
            teammateId: parsed.teammateId,
            chatTitle: reviewChatTitle,
            conversationSummary,
            projectId: new ObjectId(generationContext.projectId),
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
            teammateId: parsed.teammateId,
            chatTitle: reviewChatTitle,
            conversationSummary,
            projectId: new ObjectId(generationContext.projectId),
            userName,
            updatedAt: now,
          });
        } catch {
          // Memory refresh is best-effort.
        }
      }

      let document = loaded.document;

      if (document.status === "ready_for_review") {
        const updated = await updateAgentDocumentStatus(
          db,
          auth.userId,
          parsed.teammateId,
          parsed.documentId,
          "in_review",
        );
        document = updated ?? document;
      }

      const updatedMessages = usesUnifiedConversation
        ? await getUnifiedTaskConversationMessages(
            db,
            taskConversationKey!,
            parsed.documentId,
          )
        : await getDocumentReviewMessages(
            db,
            auth.userId,
            parsed.teammateId,
            parsed.documentId,
          );

      const updatedContextUsage = await getDocumentReviewContextUsage({
        db,
        userId: auth.userId,
        teammateId: parsed.teammateId,
        document,
        task: loaded.task,
        messages: updatedMessages,
        userName,
        modelId: session.modelId,
        reasoningEffort: session.reasoningEffort,
        conversationSummary,
        continuesTaskConversation: usesUnifiedConversation,
      });

      const response: SendDocumentReviewMessageResponse = {
        userMessage,
        assistantMessage,
        document,
        taskConversation: getTaskConversationMeta(loaded.task, loaded.projectId),
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
      { error: "Failed to send review message" },
      { status: 500 },
    );
  }
}
