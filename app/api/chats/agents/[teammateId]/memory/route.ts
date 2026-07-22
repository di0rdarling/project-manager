import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import {
  getAgentMemory,
  upsertAgentMemory,
  type StoredAgentMemory,
} from "@/lib/agents/agent-memory-store";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { getTeammateChatSummaries } from "@/lib/chats/chat-summaries";
import { requireUserId } from "@/lib/current-user";
import { generateAgentMemory } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { findUserById } from "@/lib/users";
import {
  buildAgentMemoryPrompt,
  clampAgentMemory,
} from "@/lib/prompts/agent-memory-prompt";
import { toIsoString } from "@/lib/dates";
import type { AgentMemoryResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const memory = await getAgentMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
    );

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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const chatSummaries = await getTeammateChatSummaries(
      client.db(),
      auth.userId,
      parsed.teammateId,
    );

    if (chatSummaries.length === 0) {
      return Response.json(
        { error: "No chat summaries available to generate memory from" },
        { status: 400 },
      );
    }

    const currentUser = await findUserById(client.db(), auth.userId);
    const userName = currentUser?.name ?? null;

    const teammate = getChatTeammate(parsed.teammateId);
    const generatedAt = new Date();
    const agentNotesContext = await loadAgentNotesContext(
      client.db(),
      auth.userId,
      parsed.teammateId,
    );
    const memory = clampAgentMemory(
      await generateAgentMemory(
        buildAgentMemoryPrompt({
          teammateId: parsed.teammateId,
          agentName: teammate.name,
          agentRole: teammate.role,
          chatSummaries,
          agentNotesContext,
          userName,
          generatedAt,
        }),
      ),
    );
    const now = generatedAt.toISOString();
    const stored = await upsertAgentMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
      memory,
      now,
    );

    return Response.json(serializeAgentMemory(parsed.teammateId, stored));
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
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId } = await context.params;
    const parsed = parseTeammateId(rawTeammateId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const now = new Date().toISOString();
    const stored = await upsertAgentMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
      null,
      now,
    );

    return Response.json(serializeAgentMemory(parsed.teammateId, stored));
  } catch {
    return Response.json(
      { error: "Failed to delete agent memory" },
      { status: 500 },
    );
  }
}
