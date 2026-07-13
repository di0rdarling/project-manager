import { ObjectId } from "mongodb";
import { isChatModelId } from "@/lib/chat-models";
import { getChatContextUsage } from "@/lib/chat-context/get-chat-context-usage";
import { serializeChatsWithContext } from "@/lib/chat-list-items";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";
import { findUserById } from "@/lib/users";
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
    const currentUser = await findUserById(db, auth.userId);
    const userName = currentUser?.name ?? null;
    const [chatWithContext] = await serializeChatsWithContext(db, [result.chat]);
    const messages = await db
      .collection<StoredChatMessage>("chat_messages")
      .find({ chatId: result.chatObjectId, userId: auth.userId })
      .sort({ createdAt: 1 })
      .toArray();

    const contextUsage = await getChatContextUsage(
      db,
      auth.userId,
      result.chat,
      messages,
      userName,
    );

    return Response.json({
      ...chatWithContext,
      messages: messages.map(serializeChatMessage),
      contextUsage,
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
    const updates: Record<string, unknown> = {};
    const now = new Date().toISOString();

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return Response.json({ error: "Chat title is required" }, { status: 400 });
      }

      if (title.length > 200) {
        return Response.json(
          { error: "Chat title must be 200 characters or fewer" },
          { status: 400 },
        );
      }

      updates.title = title;
      updates.titleIsCustom = true;
    }

    if (body.modelId !== undefined) {
      if (!isChatModelId(body.modelId)) {
        return Response.json({ error: "Invalid chat model" }, { status: 400 });
      }

      updates.modelId = body.modelId;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "At least one field to update is required" },
        { status: 400 },
      );
    }

    updates.updatedAt = now;

    const updateResult = await result.client
      .db()
      .collection<StoredChat>("chats")
      .findOneAndUpdate(
        { _id: result.chatObjectId, userId: auth.userId },
        {
          $set: updates,
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
