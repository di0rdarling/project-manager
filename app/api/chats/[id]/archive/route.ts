import { ObjectId } from "mongodb";
import { refreshAgentMemoryFromChatSummary } from "@/lib/agents/agent-memory-refresh";
import { requireUserId } from "@/lib/current-user";
import { generateArchivedChatSummary } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import {
  buildChatArchiveSummaryPrompt,
  clampArchivedChatSummary,
} from "@/lib/prompts/chat-archive-summary-prompt";
import { serializeChat, type StoredChat } from "@/lib/serialize/serialize-chat";
import { findUserById } from "@/lib/users";
import { isChatTeammateId } from "@/lib/chats/chat-teammates";

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

export async function POST(_request: Request, context: RouteContext) {
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

    if (result.chat.archivedAt) {
      return Response.json(
        { error: "Chat is already archived" },
        { status: 400 },
      );
    }

    const teammateId = isChatTeammateId(result.chat.teammateId)
      ? result.chat.teammateId
      : null;

    if (!teammateId) {
      return Response.json({ error: "Invalid chat teammate" }, { status: 400 });
    }

    const existingSummary = result.chat.conversationSummary?.trim() || null;
    let condensedSummary = existingSummary;

    if (existingSummary) {
      const currentUser = await findUserById(result.client.db(), auth.userId);
      const userName = currentUser?.name ?? null;

      condensedSummary = clampArchivedChatSummary(
        await generateArchivedChatSummary(
          buildChatArchiveSummaryPrompt({
            teammateId,
            chatTitle: result.chat.title,
            conversationSummary: existingSummary,
            userName,
          }),
        ),
      );
    }

    const now = new Date().toISOString();
    const updateResult = await result.client
      .db()
      .collection<StoredChat>("chats")
      .findOneAndUpdate(
        { _id: result.chatObjectId, userId: auth.userId },
        {
          $set: {
            archivedAt: now,
            ...(condensedSummary
              ? { conversationSummary: condensedSummary }
              : {}),
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );

    if (!updateResult) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    if (condensedSummary) {
      try {
        const currentUser = await findUserById(result.client.db(), auth.userId);
        await refreshAgentMemoryFromChatSummary({
          db: result.client.db(),
          userId: auth.userId,
          teammateId,
          chatTitle: updateResult.title,
          conversationSummary: condensedSummary,
          projectId: updateResult.projectId,
          userName: currentUser?.name ?? null,
          updatedAt: now,
        });
      } catch {
        // Agent memory refresh is best-effort on archive.
      }
    }

    return Response.json(serializeChat(updateResult));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI summary compression is not configured" },
        { status: 503 },
      );
    }

    return Response.json({ error: "Failed to archive chat" }, { status: 500 });
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

    if (!result.chat.archivedAt) {
      return Response.json({ error: "Chat is not archived" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateResult = await result.client
      .db()
      .collection<StoredChat>("chats")
      .findOneAndUpdate(
        { _id: result.chatObjectId, userId: auth.userId },
        {
          $set: {
            archivedAt: null,
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );

    if (!updateResult) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(serializeChat(updateResult));
  } catch {
    return Response.json({ error: "Failed to unarchive chat" }, { status: 500 });
  }
}
