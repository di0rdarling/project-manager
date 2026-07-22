import {
  getChatTeammate,
  isChatTeammateId,
  type ChatTeammateId,
} from "@/lib/chats/chat-teammates";
import { parseUserMemoryJson } from "@/lib/agents/user-memory-json";
import {
  clearUserMemory,
  getUserMemory,
  upsertUserMemory,
  type StoredUserMemory,
} from "@/lib/agents/user-memory-store";
import { loadAgentNotesContext } from "@/lib/agents/agent-notes-store";
import { getTeammateChatSummaries, RECENT_CHAT_SUMMARY_LIMIT } from "@/lib/chats/chat-summaries";
import { requireUserId } from "@/lib/current-user";
import { generateUserMemory } from "@/lib/gemini";
import getClientPromise from "@/lib/mongodb";
import { findUserById } from "@/lib/users";
import { buildUserMemoryPrompt } from "@/lib/prompts/user-memory-prompt";
import { toIsoString } from "@/lib/dates";
import type { UserMemoryResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

function serializeUserMemory(
  teammateId: ChatTeammateId,
  memory: StoredUserMemory | null,
): UserMemoryResponse {
  return {
    teammateId,
    mostRecently: memory?.mostRecently ?? null,
    stableContext: memory?.stableContext ?? [],
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
    const memory = await getUserMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
    );

    return Response.json(serializeUserMemory(parsed.teammateId, memory));
  } catch {
    return Response.json(
      { error: "Failed to fetch user memory" },
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
      { limit: RECENT_CHAT_SUMMARY_LIMIT },
    );

    if (chatSummaries.length === 0) {
      return Response.json(
        { error: "No chat summaries available to generate a summary from" },
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
    const draft = parseUserMemoryJson(
      await generateUserMemory(
        buildUserMemoryPrompt({
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
    const stored = await upsertUserMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
      draft,
      now,
    );

    return Response.json(serializeUserMemory(parsed.teammateId, stored));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return Response.json(
        { error: "AI summary generation is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate user memory" },
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
    const stored = await clearUserMemory(
      client.db(),
      auth.userId,
      parsed.teammateId,
    );

    return Response.json(serializeUserMemory(parsed.teammateId, stored));
  } catch {
    return Response.json(
      { error: "Failed to delete user memory" },
      { status: 500 },
    );
  }
}
