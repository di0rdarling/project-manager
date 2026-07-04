import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import {
  serializeChat,
  serializeChatMessage,
  type StoredChat,
  type StoredChatMessage,
} from "@/lib/serialize-chat";

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getChatOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const messages = await result.client
      .db()
      .collection<StoredChatMessage>("chat_messages")
      .find({ chatId: result.chatObjectId })
      .sort({ createdAt: 1 })
      .toArray();

    return Response.json({
      ...serializeChat(result.chat),
      messages: messages.map(serializeChatMessage),
    });
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getChatOr404(id);

    if ("error" in result) {
      return result.error;
    }

    const db = result.client.db();

    await db.collection("chat_messages").deleteMany({
      chatId: result.chatObjectId,
    });

    const deleteResult = await db.collection("chats").deleteOne({
      _id: result.chatObjectId,
    });

    if (deleteResult.deletedCount === 0) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
