import { ObjectId } from "mongodb";
import {
  generateChatReply,
  generateChatTitle,
  generateConversationSummary,
} from "@/lib/gemini";
import { getTeammateChatSummaries } from "@/lib/chat-summaries";
import getClientPromise from "@/lib/mongodb";
import { getProjectContext } from "@/lib/project-context";
import {
  buildChatConversationSummaryPrompt,
  RECENT_MESSAGE_WINDOW,
} from "@/lib/prompts/chat-conversation-summary-prompt";
import { buildChatOtherConversationsContext } from "@/lib/prompts/chat-other-conversations-prompt";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getChatOr404(chatId: string) {
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
    .findOne({ _id: chatObjectId });

  if (!chat) {
    return {
      error: Response.json({ error: "Chat not found" }, { status: 404 }),
    };
  }

  return { client, chat, chatObjectId };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getChatOr404(id);

    if ("error" in result) {
      return result.error;
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

    const existingMessages = await result.client
      .db()
      .collection<StoredChatMessage>("chat_messages")
      .find({ chatId: result.chatObjectId })
      .sort({ createdAt: 1 })
      .toArray();

    const history = existingMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const chatResponse = serializeChat(result.chat);

    const projectContext = result.chat.projectId
      ? await getProjectContext(result.client.db(), result.chat.projectId, {
          requirementId: result.chat.requirementId ?? null,
          featureId: result.chat.featureId ?? null,
        })
      : null;

    const otherChatSummaries = await getTeammateChatSummaries(
      result.client.db(),
      chatResponse.teammateId,
      { excludeChatId: result.chatObjectId },
    );
    const otherConversationsContext =
      buildChatOtherConversationsContext(otherChatSummaries) ?? undefined;

    const assistantReply = await generateChatReply(
      history,
      content,
      chatResponse.teammateId,
      projectContext ?? undefined,
      otherConversationsContext,
    );
    const now = new Date().toISOString();
    const userMessage: Omit<ChatMessage, "_id"> = {
      chatId: result.chatObjectId,
      role: "user",
      content,
      createdAt: now,
    };
    const assistantMessage: Omit<ChatMessage, "_id"> = {
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

    try {
      const recentMessages = fullTranscript.slice(-RECENT_MESSAGE_WINDOW);
      const hasTruncatedMessages =
        fullTranscript.length > recentMessages.length;

      conversationSummary = await generateConversationSummary(
        buildChatConversationSummaryPrompt({
          chatTitle: nextTitle,
          olderSummary: hasTruncatedMessages
            ? (result.chat.conversationSummary ?? null)
            : null,
          recentMessages,
        }),
      );
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
      { _id: result.chatObjectId },
      {
        $set: updatedChat,
      },
    );

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
