import { ObjectId } from "mongodb";
import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import { generateText } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { buildAgentMemoryPrompt } from "@/lib/prompts/agent-memory-prompt";
import { toIsoString } from "@/lib/dates";
import { stripRichText } from "@/lib/rich-text";
import { type StoredChat } from "@/lib/serialize-chat";
import { type StoredProject } from "@/lib/serialize-project";
import type { AgentMemoryResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

type StoredAgentMemory = {
  teammateId: ChatTeammateId;
  memory: string | null;
  updatedAt: string | Date;
};

function serializeAgentMemory(
  teammateId: ChatTeammateId,
  memory: StoredAgentMemory | null,
): AgentMemoryResponse {
  return {
    teammateId,
    memory: memory?.memory ?? null,
    updatedAt: memory ? toIsoString(memory.updatedAt) : null,
  };
}

function parseTeammateId(teammateId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  return { teammateId };
}

async function getChatSummariesForTeammate(teammateId: ChatTeammateId) {
  const client = await getClientPromise();
  const db = client.db();
  const chats = await db
    .collection<StoredChat>("chats")
    .find({ teammateId })
    .sort({ updatedAt: -1 })
    .toArray();

  const chatsWithSummaries = chats.filter(
    (chat) =>
      typeof chat.conversationSummary === "string" &&
      chat.conversationSummary.trim().length > 0,
  );

  const projectIds = [
    ...new Set(
      chatsWithSummaries
        .map((chat) => chat.projectId?.toString())
        .filter((projectId): projectId is string => Boolean(projectId)),
    ),
  ].map((projectId) => new ObjectId(projectId));

  const projects =
    projectIds.length > 0
      ? await db
          .collection<StoredProject>("projects")
          .find({ _id: { $in: projectIds } })
          .toArray()
      : [];

  const projectById = new Map(
    projects.map((project) => [project._id.toString(), project]),
  );

  return chatsWithSummaries.map((chat) => {
    const project = chat.projectId
      ? projectById.get(chat.projectId.toString())
      : undefined;

    return {
      title: chat.title,
      updatedAt: toIsoString(chat.updatedAt),
      summary: chat.conversationSummary!.trim(),
      project: project
        ? {
            name: project.name,
            description: stripRichText(project.description),
            aiSummary:
              typeof project.aiSummary === "string" &&
              project.aiSummary.trim().length > 0
                ? project.aiSummary.trim()
                : null,
          }
        : null,
    };
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const memory = await client
      .db()
      .collection<StoredAgentMemory>("agent_memories")
      .findOne({ teammateId: parsed.teammateId });

    return Response.json(serializeAgentMemory(parsed.teammateId, memory));
  } catch {
    return Response.json(
      { error: "Failed to fetch agent memory" },
      { status: 500 },
    );
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const chatSummaries = await getChatSummariesForTeammate(parsed.teammateId);

    if (chatSummaries.length === 0) {
      return Response.json(
        { error: "No chat summaries available to generate memory from" },
        { status: 400 },
      );
    }

    const teammate = getChatTeammate(parsed.teammateId);
    const memory = await generateText(
      buildAgentMemoryPrompt({
        agentName: teammate.name,
        agentRole: teammate.role,
        agentDescription: teammate.description,
        chatSummaries,
      }),
    );
    const now = new Date().toISOString();
    const client = await getClientPromise();

    await client
      .db()
      .collection<StoredAgentMemory>("agent_memories")
      .updateOne(
        { teammateId: parsed.teammateId },
        {
          $set: {
            teammateId: parsed.teammateId,
            memory,
            updatedAt: now,
          },
        },
        { upsert: true },
      );

    return Response.json(
      serializeAgentMemory(parsed.teammateId, {
        teammateId: parsed.teammateId,
        memory,
        updatedAt: now,
      }),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI memory generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate agent memory" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const now = new Date().toISOString();

    await client
      .db()
      .collection<StoredAgentMemory>("agent_memories")
      .updateOne(
        { teammateId: parsed.teammateId },
        {
          $set: {
            teammateId: parsed.teammateId,
            memory: null,
            updatedAt: now,
          },
        },
        { upsert: true },
      );

    return Response.json(
      serializeAgentMemory(parsed.teammateId, {
        teammateId: parsed.teammateId,
        memory: null,
        updatedAt: now,
      }),
    );
  } catch {
    return Response.json(
      { error: "Failed to delete agent memory" },
      { status: 500 },
    );
  }
}
