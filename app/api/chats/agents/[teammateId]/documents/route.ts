import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import {
  attachTaskTitlesToDocuments,
  getAgentDocuments,
} from "@/lib/agents/agent-documents-store";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ teammateId: string }>;
};

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
    const db = client.db();
    const documents = await getAgentDocuments(
      db,
      auth.userId,
      parsed.teammateId,
    );
    const documentsWithTasks = await attachTaskTitlesToDocuments(
      db,
      auth.userId,
      parsed.teammateId,
      documents,
    );

    return Response.json(documentsWithTasks);
  } catch {
    return Response.json(
      { error: "Failed to fetch agent documents" },
      { status: 500 },
    );
  }
}
