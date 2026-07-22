import { ObjectId } from "mongodb";
import { isChatTeammateId } from "@/lib/chats/chat-teammates";
import { getAgentDocumentById } from "@/lib/agents/agent-documents-store";
import { requireUserId } from "@/lib/current-user";
import getClientPromise from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ teammateId: string; documentId: string }>;
};

function parseRouteParams(teammateId: string, documentId: string) {
  if (!isChatTeammateId(teammateId)) {
    return {
      error: Response.json({ error: "Invalid teammate id" }, { status: 400 }),
    };
  }

  if (!ObjectId.isValid(documentId)) {
    return {
      error: Response.json({ error: "Invalid document id" }, { status: 400 }),
    };
  }

  return { teammateId, documentId };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUserId();
    if ("error" in auth) {
      return auth.error;
    }

    const { teammateId: rawTeammateId, documentId: rawDocumentId } =
      await context.params;
    const parsed = parseRouteParams(rawTeammateId, rawDocumentId);

    if ("error" in parsed) {
      return parsed.error;
    }

    const client = await getClientPromise();
    const document = await getAgentDocumentById(
      client.db(),
      auth.userId,
      parsed.teammateId,
      new ObjectId(parsed.documentId),
    );

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json(document);
  } catch {
    return Response.json(
      { error: "Failed to fetch agent document" },
      { status: 500 },
    );
  }
}
