import getClientPromise from "@/lib/mongodb";
import { serializeChat, type StoredChat } from "@/lib/serialize-chat";
import type { Chat } from "@/lib/types";

export async function GET() {
  try {
    const client = await getClientPromise();
    const chats = await client
      .db()
      .collection<StoredChat>("chats")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return Response.json(chats.map(serializeChat));
  } catch {
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const now = new Date().toISOString();
    const chat: Omit<Chat, "_id"> = {
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
    };

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection<Omit<Chat, "_id">>("chats")
      .insertOne(chat);

    return Response.json(
      serializeChat({ ...chat, _id: result.insertedId }),
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
