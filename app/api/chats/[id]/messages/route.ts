import { ObjectId, type Db } from "mongodb";
import {
  generateAgentMemory,
  generateChatReply,
  generateChatTitle,
  generateConversationSummary,
} from "@/lib/gemini";
import {
  getAgentMemory,
  getOtherTeammatesMemories,
  upsertAgentMemory,
} from "@/lib/agent-memory-store";
import { getAgentNotes } from "@/lib/agent-notes-store";
import { getTeammateChatSummaries } from "@/lib/chat-summaries";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { findUserById } from "@/lib/users";
import { getProjectContext, getAllProjectsContext } from "@/lib/project-context";
import {
  buildAgentMemoryMergePrompt,
  clampAgentMemory,
} from "@/lib/prompts/agent-memory-prompt";
import {
  buildChatConversationSummaryPrompt,
  RECENT_MESSAGE_WINDOW,
} from "@/lib/prompts/chat-conversation-summary-prompt";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
import { buildOtherTeammatesContext } from "@/lib/prompts/chat-other-teammates-context-prompt";
import { buildAgentNotesContext } from "@/lib/prompts/agent-notes-context-prompt";
import {
  buildChatTitlePrompt,
  CHAT_TITLE_GENERATION_TURN_THRESHOLD,
} from "@/lib/prompts/chat-title-prompt";
import {
  buildChatTitleFromMessage,
  serializeChat,
  serializeChatMessage,
  type StoredChat,
  type StoredChatMessage,
} from "@/lib/serialize-chat";
import type { Chat, ChatMessage } from "@/lib/types";
import {
  getChatTeammate,
  isCrossProjectTeammate,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import type { StoredProject } from "@/lib/serialize-project";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getChatOr404(chatId: string, userId: ObjectId) {
  if (!ObjectId.isValid(chatId)) {
    return {
      error: Response.json({ error: "Invalid chat id" }, { status: 400 }),
    };
  }

  const client = await getClientPromise();
  const chatObjectId = new ObjectId(chatId);
  const chat = await client
    .db()
    .collection<StoredChat>("chats")
    .findOne({ _id: chatObjectId, userId });

  if (!chat) {
    return {
      error: Response.json({ error: "Chat not found" }, { status: 404 }),
    };
  }

  return { client, chat, chatObjectId };
}

/**
 * After a chat's conversation summary refreshes, fold durable facts into
 * this teammate's compact profile Memory. Failures are swallowed so a
 * memory miss never blocks the user-visible reply.
 */
async function refreshAgentMemoryFromChatSummary(input: {
  db: Db;
  userId: ObjectId;
  teammateId: ChatTeammateId;
  chatTitle: string;
  conversationSummary: string;
  projectId: ObjectId | null | undefined;
  userName: string | null;
  updatedAt: string;
}): Promise<void> {
  const teammate = getChatTeammate(input.teammateId);
  const existing = await getAgentMemory(input.db, input.userId, input.teammateId);

  let projectName: string | null = null;
  if (input.projectId) {
    const project = await input.db
      .collection<StoredProject>("projects")
      .findOne(
        { _id: input.projectId, userId: input.userId },
        { projection: { name: 1 } },
      );
    projectName = project?.name ?? null;
  }

  const memory = clampAgentMemory(
    await generateAgentMemory(
      buildAgentMemoryMergePrompt({
        teammateId: input.teammateId,
        agentName: teammate.name,
        agentRole: teammate.role,
        existingMemory: existing?.memory ?? null,
        chatTitle: input.chatTitle,
        conversationSummary: input.conversationSummary,
        projectName,
        userName: input.userName,
      }),
    ),
  );

  await upsertAgentMemory(
    input.db,
    input.userId,
    input.teammateId,
    memory,
    input.updatedAt,
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await context.params;
    const result = await getChatOr404(id, auth.userId);

    if ("error" in result) {
      return result.error;
    }

    const currentUser = await findUserById(result.client.db(), auth.userId);
    const userName = currentUser?.name ?? null;

    const body = await request.json();
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return Response.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    const existingMessages = await result.client
      .db()
      .collection<StoredChatMessage>("chat_messages")
      .find({ chatId: result.chatObjectId, userId: auth.userId })
      .sort({ createdAt: 1 })
      .toArray();

    const history = existingMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const chatResponse = serializeChat(result.chat);

    const projectContext = isCrossProjectTeammate(chatResponse.teammateId)
      ? await getAllProjectsContext(result.client.db(), auth.userId)
      : result.chat.projectId
        ? await getProjectContext(
            result.client.db(),
            auth.userId,
            result.chat.projectId,
            {
              requirementId: result.chat.requirementId ?? null,
              featureId: result.chat.featureId ?? null,
            },
          )
        : null;

    const otherChatSummaries = await getTeammateChatSummaries(
      result.client.db(),
      auth.userId,
      chatResponse.teammateId,
      { excludeChatId: result.chatObjectId },
    );
    const otherConversationsContext =
      buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;

    const otherTeammatesMemories = await getOtherTeammatesMemories(
      result.client.db(),
      auth.userId,
      chatResponse.teammateId,
    );
    const otherTeammatesContext =
      buildOtherTeammatesContext(otherTeammatesMemories) ?? undefined;

    const agentNotes = await getAgentNotes(
      result.client.db(),
      auth.userId,
      chatResponse.teammateId,
    );
    const agentNotesContext = buildAgentNotesContext(agentNotes) ?? undefined;

    const assistantReply = await generateChatReply(
      history,
      content,
      chatResponse.teammateId,
      projectContext ?? undefined,
      otherConversationsContext,
      otherTeammatesContext,
      agentNotesContext,
      userName,
    );
    const now = new Date().toISOString();
    const userMessage: Omit<ChatMessage, "_id"> = {
      userId: auth.userId,
      chatId: result.chatObjectId,
      role: "user",
      content,
      createdAt: now,
    };
    const assistantMessage: Omit<ChatMessage, "_id"> = {
      userId: auth.userId,
      chatId: result.chatObjectId,
      role: "model",
      content: assistantReply.content,
      ...(assistantReply.sources?.length
        ? { sources: assistantReply.sources }
        : {}),
      ...(assistantReply.webSearchQueries?.length
        ? { webSearchQueries: assistantReply.webSearchQueries }
        : {}),
      ...(assistantReply.searchSuggestionsHtml
        ? { searchSuggestionsHtml: assistantReply.searchSuggestionsHtml }
        : {}),
      createdAt: now,
    };

    const db = result.client.db();
    const userInsertResult = await db
      .collection<Omit<ChatMessage, "_id">>("chat_messages")
      .insertOne(userMessage);
    const assistantInsertResult = await db
      .collection<Omit<ChatMessage, "_id">>("chat_messages")
      .insertOne(assistantMessage);

    const fullTranscript = [
      ...history,
      { role: "user" as const, content },
      { role: "model" as const, content: assistantReply.content },
    ];

    const titleIsCustom = result.chat.titleIsCustom ?? false;
    const aiTitleGenerated = result.chat.aiTitleGenerated ?? false;
    const completedTurnCount = fullTranscript.length / 2;
    let nextTitle = result.chat.title;
    let nextAiTitleGenerated = aiTitleGenerated;

    if (!titleIsCustom && !aiTitleGenerated) {
      if (existingMessages.length === 0) {
        // First exchange: give the chat an immediate, readable title.
        nextTitle = buildChatTitleFromMessage(content);
      } else if (completedTurnCount >= CHAT_TITLE_GENERATION_TURN_THRESHOLD) {
        // Enough context has accumulated (including existing chats that
        // were already past the threshold before this feature existed):
        // replace the placeholder title with an AI-generated summary.
        try {
          nextTitle = await generateChatTitle(
            buildChatTitlePrompt(fullTranscript),
          );
          nextAiTitleGenerated = true;
        } catch {
          // Keep the current title and retry on the next message.
        }
      }
    }

    let conversationSummary = result.chat.conversationSummary ?? null;
    let conversationSummaryUpdated = false;

    try {
      const recentMessages = fullTranscript.slice(-RECENT_MESSAGE_WINDOW);
      const hasTruncatedMessages =
        fullTranscript.length > recentMessages.length;

      conversationSummary = await generateConversationSummary(
        buildChatConversationSummaryPrompt({
          teammateId: chatResponse.teammateId,
          chatTitle: nextTitle,
          olderSummary: hasTruncatedMessages
            ? (result.chat.conversationSummary ?? null)
            : null,
          recentMessages,
          userName,
        }),
      );
      conversationSummaryUpdated = true;
    } catch {
      // Keep the previous summary if generation fails.
    }

    const updatedChat: Pick<
      Chat,
      "title" | "aiTitleGenerated" | "conversationSummary" | "updatedAt"
    > = {
      title: nextTitle,
      aiTitleGenerated: nextAiTitleGenerated,
      conversationSummary,
      updatedAt: now,
    };

    await db.collection<StoredChat>("chats").updateOne(
      { _id: result.chatObjectId, userId: auth.userId },
      {
        $set: updatedChat,
      },
    );

    if (conversationSummaryUpdated && conversationSummary?.trim()) {
      try {
        await refreshAgentMemoryFromChatSummary({
          db,
          userId: auth.userId,
          teammateId: chatResponse.teammateId,
          chatTitle: nextTitle,
          conversationSummary,
          projectId: result.chat.projectId,
          userName,
          updatedAt: now,
        });
      } catch {
        // Memory refresh is best-effort; the reply and chat summary already
        // succeeded, so do not fail the request if this step errors.
      }
    }

    const chat = serializeChat({
      ...result.chat,
      ...updatedChat,
    });

    return Response.json({
      chat,
      userMessage: serializeChatMessage({
        ...userMessage,
        _id: userInsertResult.insertedId,
      }),
      assistantMessage: serializeChatMessage({
        ...assistantMessage,
        _id: assistantInsertResult.insertedId,
      }),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI chat is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
