import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chat-teammates";
import { getTeammateChatSummaries } from "@/lib/chat-summaries";
import { generateAgentMemory } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { buildAgentMemoryPrompt } from "@/lib/prompts/agent-memory-prompt";
import { toIsoString } from "@/lib/dates";
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

    const chatSummaries = await getTeammateChatSummaries(
      (await getClientPromise()).db(),
      parsed.teammateId,
    );

    if (chatSummaries.length === 0) {
      return Response.json(
        { error: "No chat summaries available to generate memory from" },
        { status: 400 },
      );
    }

    const teammate = getChatTeammate(parsed.teammateId);
    const generatedAt = new Date();
    const memory = await generateAgentMemory(
      buildAgentMemoryPrompt({
        teammateId: parsed.teammateId,
        agentName: teammate.name,
        agentRole: teammate.role,
        agentDescription: teammate.description,
        chatSummaries,
        generatedAt,
      }),
    );
    const now = generatedAt.toISOString();
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
