import { ObjectId } from "mongodb";
import { generateChatReply } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { getProjectContext } from "@/lib/project-context";
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

    const projectContext = result.chat.projectId
      ? await getProjectContext(result.client.db(), result.chat.projectId)
      : null;

    const assistantContent = await generateChatReply(
      history,
      content,
      projectContext ?? undefined,
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
      content: assistantContent,
      createdAt: now,
    };

    const db = result.client.db();
    const userInsertResult = await db
      .collection<Omit<ChatMessage, "_id">>("chat_messages")
      .insertOne(userMessage);
    const assistantInsertResult = await db
      .collection<Omit<ChatMessage, "_id">>("chat_messages")
      .insertOne(assistantMessage);

    const shouldUpdateTitle =
      existingMessages.length === 0 && result.chat.title === "New Chat";
    const updatedChat: Pick<Chat, "title" | "updatedAt"> = {
      title: shouldUpdateTitle
        ? buildChatTitleFromMessage(content)
        : result.chat.title,
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
