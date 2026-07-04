import { ObjectId } from "mongodb";
import getClientPromise from "@/lib/mongodb";
import { serializeChat, type StoredChat } from "@/lib/serialize-chat";
import type { StoredProject } from "@/lib/serialize-project";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId =
      typeof body.projectId === "string" ? body.projectId.trim() : "";

    if (!projectId || !ObjectId.isValid(projectId)) {
      return Response.json(
        { error: "A valid project id is required" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db();
    const projectObjectId = new ObjectId(projectId);
    const project = await db
      .collection<StoredProject>("projects")
      .findOne({ _id: projectObjectId });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const chat: Omit<Chat, "_id"> = {
      projectId: projectObjectId,
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
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
