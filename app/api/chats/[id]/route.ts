import { ObjectId } from "mongodb";
import { serializeChatsWithContext } from "@/lib/chat-list-items";
import { requireUserId } from "@/lib/current-user";
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

export async function GET(_request: Request, context: RouteContext) {
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

    const db = result.client.db();
    const [chatWithContext] = await serializeChatsWithContext(db, [result.chat]);
    const messages = await db
      .collection<StoredChatMessage>("chat_messages")
      .find({ chatId: result.chatObjectId, userId: auth.userId })
      .sort({ createdAt: 1 })
      .toArray();

    return Response.json({
      ...chatWithContext,
      messages: messages.map(serializeChatMessage),
    });
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return Response.json({ error: "Chat title is required" }, { status: 400 });
    }

    if (title.length > 200) {
      return Response.json(
        { error: "Chat title must be 200 characters or fewer" },
        { status: 400 },
      );
    }

    const updateResult = await result.client
      .db()
      .collection<StoredChat>("chats")
      .findOneAndUpdate(
        { _id: result.chatObjectId, userId: auth.userId },
        {
          $set: {
            title,
            titleIsCustom: true,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

    if (!updateResult) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(serializeChat(updateResult));
  } catch {
    return Response.json({ error: "Failed to update chat" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const db = result.client.db();

    await db.collection("chat_messages").deleteMany({
      chatId: result.chatObjectId,
      userId: auth.userId,
    });

    const deleteResult = await db.collection("chats").deleteOne({
      _id: result.chatObjectId,
      userId: auth.userId,
    });

    if (deleteResult.deletedCount === 0) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
