import { ObjectId } from "mongodb";
import {
  DEFAULT_CHAT_TEAMMATE_ID,
  isChatTeammateId,
} from "@/lib/chat-teammates";
import { serializeChatsWithContext } from "@/lib/chat-list-items";
import getClientPromise from "@/lib/mongodb";
import { serializeChat, type StoredChat } from "@/lib/serialize-chat";
import type { StoredProject } from "@/lib/serialize-project";
import type { Chat } from "@/lib/types";

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db();
    const chats = await db
      .collection<StoredChat>("chats")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return Response.json(await serializeChatsWithContext(db, chats));
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

    const teammateId = isChatTeammateId(body.teammateId)
      ? body.teammateId
      : DEFAULT_CHAT_TEAMMATE_ID;

    const requirementId =
      typeof body.requirementId === "string" && body.requirementId.trim()
        ? body.requirementId.trim()
        : null;
    const featureId =
      typeof body.featureId === "string" && body.featureId.trim()
        ? body.featureId.trim()
        : null;

    if (requirementId && !ObjectId.isValid(requirementId)) {
      return Response.json(
        { error: "Invalid requirement id" },
        { status: 400 },
      );
    }

    if (featureId && !ObjectId.isValid(featureId)) {
      return Response.json({ error: "Invalid feature id" }, { status: 400 });
    }

    if (featureId && !requirementId) {
      return Response.json(
        { error: "A requirement must be selected when choosing a feature" },
        { status: 400 },
      );
    }

    if (requirementId) {
      const requirement = await db.collection("requirements").findOne({
        _id: new ObjectId(requirementId),
        projectId: projectObjectId,
      });

      if (!requirement) {
        return Response.json(
          { error: "Requirement not found" },
          { status: 400 },
        );
      }
    }

    if (featureId) {
      const feature = await db.collection("features").findOne({
        _id: new ObjectId(featureId),
        projectId: projectObjectId,
      });

      if (!feature) {
        return Response.json({ error: "Feature not found" }, { status: 400 });
      }

      if (
        !feature.requirementId ||
        feature.requirementId.toString() !== requirementId
      ) {
        return Response.json(
          { error: "Feature is not linked to the selected requirement" },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();
    const chat: Omit<Chat, "_id"> = {
      projectId: projectObjectId,
      requirementId: requirementId ? new ObjectId(requirementId) : null,
      featureId: featureId ? new ObjectId(featureId) : null,
      teammateId,
      title: "New Chat",
      titleIsCustom: false,
      aiTitleGenerated: false,
      conversationSummary: null,
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
